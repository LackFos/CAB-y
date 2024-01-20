class MessageBuilder {
  constructor(text = "") {
    this._text = text;
  }

  append(text, lineCount = 1) {
    const breakline = "\n".repeat(lineCount);
    this._text += `${text}${breakline}`;
    return new MessageBuilder(this.text);
  }

  newLine() {
    this._text += `\n`;
    return new MessageBuilder(this.text);
  }

  get text() {
    return this._text;
  }
}

export default MessageBuilder;
