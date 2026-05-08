import React from "react";
import { Company } from "@workspace/db/schema";
import { MapPin, Users, Calendar, Globe, Linkedin, Twitter, Github } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface CompanyDetailsProps {
  company: Company;
}

export const CompanyDetails: React.FC<CompanyDetailsProps> = ({ company }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-4 mb-6">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="w-16 h-16 object-contain" />
        ) : (
          <div className="w-16 h-16 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            {company.name.charAt(0)}
          </div>
        )}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{company.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{company.industry}</p>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
        {company.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <MapPin className="w-5 h-5 text-[var(--brand-primary)]" />
          <span>{company.headquarters}</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <Users className="w-5 h-5 text-[var(--brand-primary)]" />
          <span>{company.companySize}</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <Calendar className="w-5 h-5 text-[var(--brand-primary)]" />
          <span>Founded in {company.foundedYear}</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
          <Globe className="w-5 h-5 text-[var(--brand-primary)]" />
          <a
            href={company.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            onClick={() => {
              trackEvent({
                eventType: "company_site_clicked",
                eventCategory: "CompanyDetails",
                eventAction: "click_website",
                metadata: { companyId: company.id, website: company.website },
              });
            }}
          >
            Official Website
          </a>
        </div>
      </div>

      {company.culture && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Our Culture</h3>
          <p className="text-gray-600 dark:text-gray-300">{company.culture}</p>
        </div>
      )}

      {company.benefits && company.benefits.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Benefits & Perks</h3>
          <div className="flex flex-wrap gap-2">
            {(company.benefits as string[]).map((benefit, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-[var(--brand-primary)] bg-opacity-10 text-[var(--brand-primary)] rounded-full text-sm font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4 border-t border-gray-100 dark:border-gray-700 pt-6">
        {company.socialLinks?.linkedin && (
          <a
            href={company.socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[var(--brand-primary)] transition-colors"
            onClick={() => {
              trackEvent({
                eventType: "company_social_clicked",
                eventCategory: "CompanyDetails",
                eventAction: "click_social",
                metadata: { companyId: company.id, network: "linkedin", url: company.socialLinks?.linkedin },
              });
            }}
          >
            <Linkedin className="w-6 h-6" />
          </a>
        )}
        {company.socialLinks?.twitter && (
          <a
            href={company.socialLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[var(--brand-primary)] transition-colors"
            onClick={() => {
              trackEvent({
                eventType: "company_social_clicked",
                eventCategory: "CompanyDetails",
                eventAction: "click_social",
                metadata: { companyId: company.id, network: "twitter", url: company.socialLinks?.twitter },
              });
            }}
          >
            <Twitter className="w-6 h-6" />
          </a>
        )}
        {company.socialLinks?.github && (
          <a
            href={company.socialLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[var(--brand-primary)] transition-colors"
            onClick={() => {
              trackEvent({
                eventType: "company_social_clicked",
                eventCategory: "CompanyDetails",
                eventAction: "click_social",
                metadata: { companyId: company.id, network: "github", url: company.socialLinks?.github },
              });
            }}
          >
            <Github className="w-6 h-6" />
          </a>
        )}
      </div>
    </div>
  );
};
