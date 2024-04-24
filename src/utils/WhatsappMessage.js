class WhatsappMessage {
  constructor(packet) {
    this.ref = packet;
    this.remoteJid = this.extractRemoteJid(packet);
    this.sender = this.extractSender(packet);
    this.text = this.extractText(packet);
    this.quoted = this.extractQuoted(packet);
    this.mentionedJid = this.extractMention(packet);
  }

  extractRemoteJid(packet) {
    return packet.key.remoteJid;
  }

  extractSender(packet) {
    return packet.key.participant;
  }

  extractText(packet) {
    return (
      packet.message?.extendedTextMessage?.text ??
      packet.message?.conversation ??
      ""
    );
  }

  extractQuoted(packet) {
    const contextInfo = packet.message?.extendedTextMessage?.contextInfo;

    return {
      message:
        contextInfo?.quotedMessage?.extendedTextMessage?.text ??
        contextInfo?.quotedMessage?.conversation,
      participant: contextInfo?.participant,
    };
  }

  extractMention(packet) {
    return packet.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  }
}

export default WhatsappMessage;
