const DEFAULT_OPTIONS = {
  placeholder: 'Start typing…',
  autoCapitalizeHeadings: true,
  autoCapitalizeFirstWord: true,
  autoCapitalizeIndented: false,
  autoFullStop: true,
  highlightEnabled: true,
  highlightClass: 'ntw-highlight'
};

function normalizeOptions(userOptions = {}) {
  return { ...DEFAULT_OPTIONS, ...userOptions };
}

export class NotethingWidget {
  constructor(element, options = {}) {
    this.options = normalizeOptions(options);
    this.root = this._resolveElement(element);
    this.root.classList.add('ntw-editor');
    this._applyBaseStyles();
    // Prefer plaintext-only when available so pasted HTML is stripped while still
    // behaving as a normal contenteditable for typing. Fallback to true on
    // browsers that do not support the value.
    this.root.setAttribute('contenteditable', 'plaintext-only');
    if (this.root.contentEditable !== 'plaintext-only') {
      this.root.contentEditable = 'true';
    }
    this.root.setAttribute('role', 'textbox');
    this.root.setAttribute('aria-multiline', 'true');
    this.root.dataset.placeholder = this.options.placeholder;

    this._normalizeStructure();
    this._applyFormattingToAllLines();
    this._updatePlaceholderState();

    this._boundKeydown = this._handleKeydown.bind(this);
    this._boundInput = this._handleInput.bind(this);
    this.root.addEventListener('keydown', this._boundKeydown);
    this.root.addEventListener('input', this._boundInput);
  }

  destroy() {
    this.root.removeEventListener('keydown', this._boundKeydown);
    this.root.removeEventListener('input', this._boundInput);
  }

  _applyBaseStyles() {
    const style = this.root.style;
    if (!style.minHeight) style.minHeight = '180px';
    if (!style.padding) style.padding = '12px';
    if (!style.border) style.border = '1px solid #d0d7de';
    if (!style.borderRadius) style.borderRadius = '8px';
    if (!style.background) style.background = '#fff';
    if (!style.color) style.color = '#111827';
    if (!style.whiteSpace) style.whiteSpace = 'pre-wrap';
    if (!style.wordBreak) style.wordBreak = 'break-word';
  }

  _resolveElement(element) {
    if (element instanceof HTMLElement) {
      return element;
    }

    const found = document.querySelector(element);
    if (!found) {
      throw new Error(`Unable to find element for selector: ${element}`);
    }
    return found;
  }

  _handleInput() {
    this._normalizeStructure();
    this._applyFormattingToAllLines();
    this._updatePlaceholderState();
  }

  _handleKeydown(event) {
    if (event.key === 'Enter') {
      this._handleEnter(event);
      return;
    }

    if (this.options.highlightEnabled && event.key.toLowerCase() === 'h' && event.ctrlKey && event.shiftKey) {
      event.preventDefault();
      this._toggleHighlightSelection();
    }
  }

  _handleEnter(event) {
    event.preventDefault();
    const lineEl = this._getCurrentLineElement();
    if (!lineEl) return;

    const text = lineEl.textContent || '';
    const indentation = text.match(/^\s*/)?.[0] ?? '';
    const trimmed = text.trim();

    if (this.options.autoFullStop && trimmed && !trimmed.startsWith('#') && !/[.!?]$/.test(trimmed)) {
      lineEl.textContent = `${text.trimEnd()}.`;
    }

    this._applyFormattingToLine(lineEl);

    const newLine = document.createElement('div');
    newLine.textContent = indentation;
    if (!indentation) {
      newLine.innerHTML = '<br>';
    }

    if (lineEl.nextSibling) {
      lineEl.parentNode.insertBefore(newLine, lineEl.nextSibling);
    } else {
      lineEl.parentNode.appendChild(newLine);
    }

    this._placeCursor(newLine, indentation.length);
    this._updatePlaceholderState();
  }

  _toggleHighlightSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    wrapper.className = this.options.highlightClass;

    try {
      const contents = range.extractContents();
      wrapper.appendChild(contents);
      range.insertNode(wrapper);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      selection.addRange(newRange);
    } catch (err) {
      console.warn('Unable to highlight selection', err);
    }
  }

  _getCurrentLineElement() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    if (node === this.root) {
      return this.root.firstElementChild;
    }

    while (node && node !== this.root) {
      if (node.parentElement === this.root && node.nodeType === Node.ELEMENT_NODE) {
        return node;
      }
      node = node.parentNode;
    }
    return this.root.firstElementChild;
  }

  _normalizeStructure() {
    if (this.root.childNodes.length === 0) {
      const line = document.createElement('div');
      line.appendChild(document.createTextNode(''));
      this.root.appendChild(line);
      return;
    }

    const nodes = Array.from(this.root.childNodes);
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const line = document.createElement('div');
        line.textContent = node.textContent;
        this.root.insertBefore(line, node);
        this.root.removeChild(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'DIV') {
        const line = document.createElement('div');
        line.innerHTML = node.innerHTML || '<br>';
        this.root.insertBefore(line, node);
        this.root.removeChild(node);
      }
    }
  }

  _applyFormattingToAllLines() {
    const lines = Array.from(this.root.children);
    if (lines.length === 0) return;

    for (const line of lines) {
      this._applyFormattingToLine(line);
    }
  }

  _applyFormattingToLine(lineEl) {
    const text = lineEl.textContent ?? '';
    const trimmedText = text.trim();
    if (!trimmedText) {
      if (text.length) {
        lineEl.textContent = text;
      } else {
        lineEl.innerHTML = '<br>';
      }
      return;
    }

    let result = text;

    if (this.options.autoCapitalizeHeadings && result.trim().startsWith('#')) {
      const [hashes, ...rest] = result.trim().split(/\s+/);
      const capitalized = rest.map(word => word ? word[0].toUpperCase() + word.slice(1) : '').join(' ');
      result = `${hashes} ${capitalized}`.trim();
    }

    const leadingWhitespace = result.match(/^\s*/)?.[0] ?? '';
    const contentWithoutIndent = result.slice(leadingWhitespace.length);
    const shouldCapitalize = this.options.autoCapitalizeFirstWord && (this.options.autoCapitalizeIndented || leadingWhitespace.length === 0);

    if (shouldCapitalize && contentWithoutIndent) {
      result = `${leadingWhitespace}${contentWithoutIndent[0].toUpperCase()}${contentWithoutIndent.slice(1)}`;
    }

    lineEl.textContent = result;
  }

  _updatePlaceholderState() {
    const hasContent = (this.root.textContent ?? '').length > 0;
    this.root.classList.toggle('ntw-has-content', hasContent);
  }

  _placeCursor(lineEl, column = 0) {
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();

    const range = document.createRange();
    let targetNode = lineEl.childNodes[0];

    if (!targetNode || targetNode.nodeType !== Node.TEXT_NODE) {
      const textNode = document.createTextNode(targetNode?.textContent ?? '');
      lineEl.textContent = '';
      lineEl.appendChild(textNode);
      targetNode = textNode;
    }

    const offset = Math.min(column, targetNode.textContent?.length ?? 0);
    range.setStart(targetNode, offset);
    range.collapse(true);
    selection.addRange(range);
  }
}

export default NotethingWidget;
