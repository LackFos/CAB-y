class MessageBuilder {
  constructor(text = "") {
    this._text = text;
  }

  /**
   * Append new text line(s) to the existing message.
   * @param {string} text - The text to be appended.
   * @param {number} [lineCount=1] - The number of line breaks to be added after the text. Default is 1.
   * @returns {MessageBuilder} - A new MessageBuilder instance with the updated text.
   */
  append(text, lineCount = 1) {
    const breakline = "\n".repeat(lineCount);
    this._text += `${text}${breakline}`;
    return new MessageBuilder(this.text);
  }

  /**
   * Append a new line to the existing message.
   * @returns {MessageBuilder} - A new MessageBuilder instance with the added line break.
   */
  newLine() {
    this._text += `\n`;
    return new MessageBuilder(this.text);
  }

  /**
   * Apply a callback function to each element of the array and append the result to the message.
   * @param {Array} array - The array to iterate over.
   * @param {Function} callback - Function to apply to each element, taking one argument.
   * @returns {void}
   */
  map(array, callback) {
    array.forEach((item) => {
      this.append(callback(item));
    });
  }

  /**
   * Get the current text content of the message.
   * @returns {string} - The current text content.
   */
  get text() {
    return this._text;
  }
}

export default MessageBuilder;
