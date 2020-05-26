import { toHexString, toBase64 } from "../shared/utils";

function createCertificateInfoDialog(subject: any, certHexString: any, inspectUrl: any): any {
  const ui = {
    dialog:  document.createElement("div"),
    subject: document.createElement("span"),
    cert:    document.createElement("textarea"),
    inspect: document.createElement("a"),
    close:   document.createElement("button"),
  };

  ui.dialog.style.font         = "14px monospace";
  ui.dialog.style.color        = "black";
  ui.dialog.style.background   = "white";
  ui.dialog.style.position     = "fixed";
  ui.dialog.style.zIndex       = "10000";
  ui.dialog.style.top          = "0";
  ui.dialog.style.right        = "0";
  ui.dialog.style.width        = "400px";
  ui.dialog.style.padding      = "1em";
  ui.dialog.style.border       = "1px solid black";
  ui.dialog.style.marginBottom = "1em";
  ui.dialog.style.textAlign    = "left";

  ui.subject.style.fontWeight = "bold";
  ui.subject.style.wordWrap   = "break-word";
  ui.subject.innerText        = subject;

  ui.cert.style.font       = "10px monospace";
  ui.cert.style.width      = "100%";
  ui.cert.style.height     = "6em";
  ui.cert.style.border     = "1px solid black";
  ui.cert.style.background = "none";
  ui.cert.style.margin     = "1em 0";
  ui.cert.style.boxSizing  = "border-box";
  ui.cert.innerText        = certHexString;

  ui.inspect.style.marginBottom = "1em";
  ui.inspect.innerText          = "Inspect cert";
  ui.inspect.target             = "_blank";
  ui.inspect.href               = inspectUrl;

  ui.close.style.width      = "100%";
  ui.close.style.lineHeight = "2em";
  ui.close.style.margin     = "1em 0";
  ui.close.innerText        = "Close";
  ui.close.onclick          = (): any => document.body.removeChild(ui.dialog);

  ui.dialog.appendChild(ui.subject);
  ui.dialog.appendChild(ui.cert);
  ui.dialog.appendChild(ui.inspect);
  ui.dialog.appendChild(ui.close);

  document.body.appendChild(ui.dialog);
}

export default function displayCertificateInfoDialog(certificateInfo: any): any {
  const { rawDER, subject } = certificateInfo;
  const inspectUrl = `https://lapo.it/asn1js/#${toBase64(rawDER)}`;
  const certHexString = toHexString(rawDER);

  createCertificateInfoDialog(subject, certHexString, inspectUrl);
}
