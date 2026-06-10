export type CorporateIdentityLike = {
  companyName?: string | null;
  companyShortName?: string | null;
  companySubtitle?: string | null;
  companyLogoDataUrl?: string | null;
  showCompanyNameBesideLogo?: boolean | null;
  showCompanyOnCertificates?: boolean | null;
  showCompanyOnTags?: boolean | null;
  showCompanyOnReports?: boolean | null;
  logoUrl?: string | null;
  logoText?: string | null;
  facilityName?: string | null;
  departmentName?: string | null;
};

export function getCorporateIdentity(general?: CorporateIdentityLike | null) {
  const facility = general?.facilityName || "Shedgum Gas Plant";
  const department = general?.departmentName || "Maintenance";
  const companyName = general?.companyName || "Company Name";
  const companyShortName = general?.companyShortName || companyName || "Company";
  const companySubtitle = general?.companySubtitle || `${facility} / ${department}`;
  const companyLogo = general?.companyLogoDataUrl || general?.logoUrl || "";
  return {
    companyName,
    companyShortName,
    companySubtitle,
    companyLogo,
    showName: general?.showCompanyNameBesideLogo !== false,
    showOnCertificates: general?.showCompanyOnCertificates !== false,
    showOnTags: general?.showCompanyOnTags !== false,
    showOnReports: general?.showCompanyOnReports !== false,
  };
}

export function initialsFromCompanyName(name?: string | null) {
  const value = (name || "SBTS").trim();
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(word => word[0]).join("").toUpperCase();
}
