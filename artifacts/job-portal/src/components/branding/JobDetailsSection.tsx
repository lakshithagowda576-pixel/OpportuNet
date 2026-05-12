import React from "react";
import { Briefcase, DollarSign, MapPin, Clock } from "lucide-react";

interface JobDetailsSectionProps {
  job: {
    title: string;
    category: string;
    location: string;
    salary: string;
    shift: string;
    description: string;
    eligibility: string;
  };
}

export const JobDetailsSection: React.FC<JobDetailsSectionProps> = ({ job }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h2>
          <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Briefcase className="w-4 h-4" />
              <span>{job.category}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>{job.salary}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{job.shift}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{job.description}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{job.eligibility}</p>
        </div>
      </div>
    </div>
  );
};
