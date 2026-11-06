/**
 * Public identity of the site. Edit this file to change what the About, Contact, Editorial policy and Privacy pages say.
 */
export const SITE = {
  name: "Armonia Capital",
  tagline: "Markets seek equilibrium",
  // Publicly shown address. Create it for free with Cloudflare Email Routing (it can forward to your Gmail).
  contactEmail: "contact@armoniacapital.com",
  // Who is behind the site. Add your name here if you want it shown (ad networks like transparency).
  ownerLine: "Armonia Capital is an independent publication run by its founder, a developer based in Algeria.",
  country: "Algeria",
  founded: "2026",
  // Optional postal address, shown in the privacy policy and useful for email compliance. Leave empty to hide it.
  postalAddress: "",
} as const;
