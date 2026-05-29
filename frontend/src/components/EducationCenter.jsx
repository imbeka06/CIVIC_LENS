import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalizedStrings } from '../i18n/useLocalizedStrings';

const EducationCenter = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState({ finance_bills: [], campaign_laws: [] });
  const [updatedAt, setUpdatedAt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');

  const englishStrings = useMemo(() => ({
    title: 'Learn and Educate Yourself',
    subtitle: 'Explore constitutional, campaign finance, and latest Finance Bill resources in Kenya.',
    liveUpdate: 'Live update feed',
    searchLabel: 'Search for bills, acts, and campaign laws',
    searchPlaceholder: 'Example: Finance Bill 2026, campaign bills passed',
    searchButton: 'Search',
    featuredFinance: 'Latest Finance Bill and Public Finance Documents',
    featuredCampaign: 'Crucial Campaign and Electoral Laws',
    resultsTitle: 'Search Results',
    noResults: 'No matching documents yet. Try a different keyword.',
    openSource: 'Open or Download',
    askAi: 'Ask AI to Explain',
    loading: 'Loading...',
    source: 'Source:',
    year: 'Year:',
    category: 'Category:',
    updatedAt: 'Updated:',
    searchHelp: 'Mini-search mode: finds relevant Kenyan law and bill documents from public web sources.',
    errorPrefix: 'Error:'
  }), []);
  const s = useLocalizedStrings(englishStrings);

  useEffect(() => {
    setLoadingFeatured(true);
    setError('');

    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/education/featured`)
      .then((res) => {
        if (!res.ok) throw new Error('Could not load featured documents');
        return res.json();
      })
      .then((data) => {
        setFeatured({
          finance_bills: data.finance_bills || [],
          campaign_laws: data.campaign_laws || []
        });
        setUpdatedAt(data.updated_at || '');
      })
      .catch((err) => setError(err.message || 'Failed to load featured documents'))
      .finally(() => setLoadingFeatured(false));
  }, []);

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoadingSearch(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'}/education/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.detail || 'Search failed');
      }

      const payload = await response.json();
      setSearchResults(payload.results || []);
    } catch (err) {
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const sendToAiExplainer = (doc) => {
    navigate('/module-5', {
      state: {
        educationDoc: {
          title: doc.title,
          url: doc.url,
          snippet: doc.snippet || ''
        }
      }
    });
  };

  const renderDocumentCard = (doc, idx) => (
    <div key={`${doc.url || doc.title}-${idx}`} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-800 leading-snug">{doc.title}</h4>
      <div className="mt-2 space-y-1 text-xs text-slate-500">
        <p>{s.source} {doc.source || 'N/A'}</p>
        <p>{s.year} {doc.year || 'N/A'}</p>
        <p>{s.category} {doc.category || 'general'}</p>
      </div>
      {doc.snippet && <p className="mt-3 text-xs text-slate-600">{doc.snippet}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 text-xs font-semibold rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          {s.openSource}
        </a>
        <button
          onClick={() => sendToAiExplainer(doc)}
          className="px-3 py-2 text-xs font-semibold rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
        >
          {s.askAi}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-l-4 border-indigo-600 pl-4">
        <h2 className="text-3xl font-bold text-slate-800">{s.title}</h2>
        <p className="text-slate-500 mt-2 text-sm">{s.subtitle}</p>
        {updatedAt && (
          <p className="text-[11px] text-indigo-600 font-semibold mt-2">{s.updatedAt} {new Date(updatedAt).toLocaleString()}</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.searchLabel}</label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={s.searchPlaceholder}
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
              }
            }}
          />
          <button
            onClick={runSearch}
            className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
          >
            {loadingSearch ? s.loading : s.searchButton}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">{s.searchHelp}</p>
        {error && <p className="text-sm text-red-600">{s.errorPrefix} {error}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{s.featuredFinance}</h3>
          {loadingFeatured ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500">{s.loading}</div>
          ) : (
            <div className="space-y-3">
              {featured.finance_bills.map(renderDocumentCard)}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">{s.featuredCampaign}</h3>
          {loadingFeatured ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500">{s.loading}</div>
          ) : (
            <div className="space-y-3">
              {featured.campaign_laws.map(renderDocumentCard)}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">{s.resultsTitle}</h3>
        {loadingSearch ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500">{s.loading}</div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {searchResults.map(renderDocumentCard)}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-500">{s.noResults}</div>
        )}
      </section>
    </div>
  );
};

export default EducationCenter;
