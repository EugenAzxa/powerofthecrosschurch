/* ==========================================================================
   Church settings - edit this file, nothing else, then reload.
   No build step is needed for anything on this page.
   ========================================================================== */
window.POCC_CONFIG = {

  /* ---- Card giving -------------------------------------------------------
     Create one payment link per amount with whatever processor the church
     uses (Stripe Payment Links, PayPal, Donorbox, tithe.ly, CanadaHelps...)
     and paste the URLs below.

     While every link is empty the card panel stays hidden and the page shows
     e-Transfer only, so the site is never live with a button that goes
     nowhere. Fill in even one link and the panel appears.                  */
  payLinks: {
    "25":    "",
    "50":    "",
    "100":   "",
    "250":   "",
    "other": ""    // open amount - the donor types their own
  },

  /* ---- INTERAC e-Transfer ------------------------------------------------
     The address people send e-Transfers to. Leave empty and the page asks
     visitors to phone the church for it instead.                           */
  etransferEmail: ""
};
