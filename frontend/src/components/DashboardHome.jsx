import React from 'react';
import { Link } from 'react-router-dom';
import { useLocalizedStrings } from '../i18n/useLocalizedStrings';

const DashboardHome = () => {
  const englishStrings = React.useMemo(() => ({
    hubTitle: 'Laboratory Modules',
    hubSubtitle: 'Select an analytical engine below to begin your investigation.',
    module1Title: 'Funding Trends',
    module1Subtitle: 'War Chest Analysis',
    module1Description: 'Analyze total capital raised by top candidates using vertical bar charts.',
    module2Title: 'Network Intelligence',
    module2Subtitle: 'Relational Dynamics',
    module2Description: 'Interactive physics-based graph mapping donor cliques and power brokers.',
    module3Title: 'Geospatial Wealth',
    module3Subtitle: 'Regional Concentration',
    module3Description: 'Choropleth map detailing the Funding Concentration Index (FCI) across Kenya.',
    module4Title: 'Policy Simulator',
    module4Subtitle: 'Regulatory Impact Engine',
    module4Description: 'Test hypothetical campaign finance regulations and instantly observe impacts.',
    module5Title: 'AI Explainer Bot',
    module5Subtitle: 'Multilingual LLM Intelligence',
    module5Description: 'Generates local-language dossiers explaining campaign finance networks.',
    moduleIntakeTitle: 'Data Intake Pipeline',
    moduleIntakeSubtitle: 'AI Extraction Engine',
    moduleIntakeDescription: 'Upload unstructured documents and let the LLM automatically extract financial networks.',
    moduleIntakeDropLabel: 'Drop Document Here'
  }), []);
  const s = useLocalizedStrings(englishStrings);

  const modules = [
    {
      id: "module-1",
      title: s.module1Title,
      subtitle: s.module1Subtitle,
      description: s.module1Description,
      link: "/module-1",
      color: "emerald",
      preview: (
        <div className="flex items-end h-16 gap-2 w-full mt-4 opacity-80">
          <div className="w-1/5 bg-emerald-300 h-[40%] rounded-t-sm"></div>
          <div className="w-1/5 bg-emerald-400 h-[70%] rounded-t-sm"></div>
          <div className="w-1/5 bg-emerald-600 h-[100%] rounded-t-sm"></div>
          <div className="w-1/5 bg-emerald-500 h-[60%] rounded-t-sm"></div>
          <div className="w-1/5 bg-emerald-200 h-[30%] rounded-t-sm"></div>
        </div>
      )
    },
    {
      id: "module-2",
      title: s.module2Title,
      subtitle: s.module2Subtitle,
      description: s.module2Description,
      link: "/module-2",
      color: "blue",
      preview: (
        <div className="relative h-16 w-full mt-4 flex items-center justify-center opacity-70">
          <div className="absolute w-2 h-2 bg-blue-600 rounded-full top-2 left-4"></div>
          <div className="absolute w-4 h-4 bg-blue-500 rounded-full top-6 left-12"></div>
          <div className="absolute w-3 h-3 bg-blue-400 rounded-full bottom-2 right-10"></div>
          <div className="absolute w-5 h-5 bg-blue-700 rounded-full top-4 right-4"></div>
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
            <line x1="20" y1="12" x2="52" y2="32" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="52" y1="32" x2="150" y2="50" stroke="#94a3b8" strokeWidth="3" />
            <line x1="52" y1="32" x2="180" y2="25" stroke="#cbd5e1" strokeWidth="1" />
          </svg>
        </div>
      )
    },
    {
      id: "module-3",
      title: s.module3Title,
      subtitle: s.module3Subtitle,
      description: s.module3Description,
      link: "/module-3",
      color: "amber",
      preview: (
        <div className="flex flex-wrap h-16 w-full mt-4 gap-1 opacity-80">
          {[...Array(14)].map((_, i) => (
            <div key={i} className={`h-7 flex-1 min-w-[30px] rounded-sm ${i % 3 === 0 ? 'bg-amber-600' : i % 2 === 0 ? 'bg-amber-400' : 'bg-amber-200'}`}></div>
          ))}
        </div>
      )
    },
    {
      id: "module-4",
      title: s.module4Title,
      subtitle: s.module4Subtitle,
      description: s.module4Description,
      link: "/module-4",
      color: "rose",
      preview: (
        <div className="flex flex-col h-16 w-full mt-4 gap-2 justify-center opacity-80">
          <div className="flex items-center gap-2">
            <div className="w-10 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-4 h-full bg-rose-500"></div>
            </div>
            <div className="flex-1 h-1 bg-slate-100 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-10 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="w-7 h-full bg-rose-400"></div>
            </div>
            <div className="w-3/4 h-1 bg-slate-100 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      id: "module-5",
      title: s.module5Title,
      subtitle: s.module5Subtitle,
      description: s.module5Description,
      link: "/module-5",
      color: "purple",
      preview: (
        <div className="flex flex-col h-16 w-full mt-4 gap-2 justify-end opacity-90">
          <div className="w-2/3 bg-slate-200 h-4 rounded-full rounded-tl-none self-start"></div>
          <div className="w-3/4 bg-purple-500 h-4 rounded-full rounded-tr-none self-end"></div>
          <div className="w-1/2 bg-purple-500 h-4 rounded-full rounded-tr-none self-end"></div>
        </div>
      )
    },
    {
      id: "module-intake",
      title: s.moduleIntakeTitle,
      subtitle: s.moduleIntakeSubtitle,
      description: s.moduleIntakeDescription,
      link: "/data-intake",
      color: "slate",
      preview: (
        <div className="flex items-center justify-center h-16 w-full mt-4 opacity-70 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{s.moduleIntakeDropLabel}</span>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-l-4 border-blue-600 pl-4">
        <h2 className="text-3xl font-bold text-slate-800">{s.hubTitle}</h2>
        <p className="text-slate-500 mt-2 text-sm">{s.hubSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <Link 
            key={mod.id} 
            to={mod.link}
            className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer h-[260px]"
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-${mod.color}-500 group-hover:h-2 transition-all`}></div>
            
            <div className="mt-2">
              <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 text-${mod.color}-600`}>{mod.subtitle}</p>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-600 transition-colors">{mod.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{mod.description}</p>
            </div>
            
            <div className="mt-auto border-t border-slate-100 pt-4">
              {mod.preview}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;