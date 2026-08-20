import React, { useMemo, useRef, useState } from 'react';
import {
  Upload, Users, Trash2, Send, FileSpreadsheet, Download, AlertTriangle,
  UserPlus, Search
} from 'lucide-react';
import { Employee, Facility, EmployeeImportResult } from '../../../shared/facilityTypes';
import * as facilityApi from '../../../services/facilityApi';

interface EmployeeRosterPanelProps {
  facility: Facility;
  employees: Employee[];
  onRosterChanged: () => void;
  providerLive: boolean;
}

const blankDraft = {
  employeeCode: '',
  name: '',
  phone: '',
  department: '',
  zoneId: '',
  role: '',
  shift: 'general' as Employee['shift'],
  language: 'en' as Employee['language']
};

/** White surface, hairline border, black focus ring. */
const FIELD =
  'bg-paper border border-line px-3 py-2 text--footnote text-ink placeholder:text-muted outline-none focus:border-ink';

const TH = 'px-4 py-2.5 text--eyebrow text-muted font-medium';

/** 0.25s hue transition for labels whose colour changes with state. */
const HUE = 'transition-colors duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)]';

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || '—';

export default function EmployeeRosterPanel({
  facility,
  employees,
  onRosterChanged,
  providerLive
}: EmployeeRosterPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState({ ...blankDraft });
  const [toast, setToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const zoneName = (id: string) => facility.blueprint.zones.find(z => z.id === id)?.name || '—';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e =>
      [e.name, e.phone, e.employeeCode, e.department, e.role, zoneName(e.zoneId)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [employees, query]);

  const readFile = (file: File) =>
    new Promise<{ format: 'csv' | 'xlsx'; content: string }>((resolve, reject) => {
      const isWorkbook = /\.(xlsx|xls)$/i.test(file.name);
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read that file'));
      reader.onload = () => {
        if (isWorkbook) {
          const base64 = String(reader.result).split(',')[1] || '';
          resolve({ format: 'xlsx', content: base64 });
        } else {
          resolve({ format: 'csv', content: String(reader.result) });
        }
      };
      if (isWorkbook) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const { format, content } = await readFile(file);
      const res = await facilityApi.importEmployees(facility.id, { format, content, mode: importMode });
      setResult(res);
      onRosterChanged();
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAddManual = async () => {
    if (!draft.name.trim() || !draft.phone.trim()) {
      setError('Name and phone number are required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await facilityApi.saveEmployee(facility.id, draft);
      setDraft({ ...blankDraft });
      onRosterChanged();
    } catch (err: any) {
      setError(err?.message || 'Could not add employee');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    await facilityApi.removeEmployee(facility.id, employeeId);
    onRosterChanged();
  };

  const handleTest = async (employeeId: string) => {
    setBusy(true);
    try {
      const dispatch = await facilityApi.sendTestMessage(facility.id, employeeId);
      setToast(
        dispatch.status === 'simulated'
          ? `Test message rendered for ${dispatch.employeeName} (simulation mode — no live credentials).`
          : `Test WhatsApp sent to ${dispatch.employeeName} at ${dispatch.phone}.`
      );
      setTimeout(() => setToast(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Test message failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import card */}
      <div className="panel p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text--subtitle3 text-ink flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-ink" strokeWidth={1.5} />
              Employee Roster Import
            </h3>
            <p className="text--footnote text-subtle mt-2 max-w-2xl">
              Upload the plant register as <span className="text-ink">.csv</span>,{' '}
              <span className="text-ink">.xlsx</span> or{' '}
              <span className="text-ink">.xls</span>. Column headers are matched
              loosely — <span className="text-ink">mobile</span>, <span className="text-ink">phone_number</span>{' '}
              and <span className="text-ink">whatsapp</span> all map to the contact number.
            </p>
          </div>
          <a
            href={facilityApi.employeeTemplateUrl}
            className="cta cta--secondary cta--compact shrink-0 flex items-center gap-1.5"
          >
            <Download className="w-3 h-3" strokeWidth={1.5} /> CSV Template
          </a>
        </div>

        <div className="flex items-center gap-2">
          {(['replace', 'append'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setImportMode(mode)}
              className={`px-3 py-1.5 rounded-[3px] text--eyebrow border transition-colors ${
                importMode === mode
                  ? 'bg-ink border-ink text-paper'
                  : 'bg-paper border-line text-subtle hover:border-muted hover:text-ink'
              }`}
            >
              {mode === 'replace' ? 'Replace roster' : 'Append / update'}
            </button>
          ))}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileRef.current?.click()}
          className={`border border-dashed rounded-[4px] p-10 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-ink bg-wash' : 'border-line hover:border-muted bg-paper'
          }`}
        >
          <Upload className="w-5 h-5 mx-auto text-muted mb-3" strokeWidth={1.5} />
          <p className="text--body text-ink">
            {busy ? 'Processing roster…' : 'Drop the employee sheet here, or click to browse'}
          </p>
          <p className="text--footnote text-muted mt-2">
            employee_code · name · phone · department · zone_id · role · shift · language
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 text--footnote text-near panel--wash p-3 sev-row--critical">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
            <span><span className="sev-text--critical">Error — </span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text--footnote panel--wash p-3">
              <span className="sev-mark sev-mark--ok" />
              <span className="sev-text--ok">IMPORTED</span>
              <span className="text-near tabular-nums">
                {result.imported} of {result.total} rows
                {result.skipped > 0 && ` · ${result.skipped} skipped`}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="panel p-3 space-y-1.5 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text--footnote">
                    <span className="sev-mark sev-mark--advisory" />
                    <span className="sev-text--advisory">ROW {e.row}</span>
                    <span className="text-subtle">{e.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual add */}
      <div className="panel p-6 space-y-4">
        <h3 className="text--subtitle3 text-ink flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-ink" strokeWidth={1.5} /> Add a single employee
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            value={draft.employeeCode}
            onChange={e => setDraft({ ...draft, employeeCode: e.target.value })}
            placeholder="Code (SF013)"
            className={FIELD}
          />
          <input
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="Full name"
            className={FIELD}
          />
          <input
            value={draft.phone}
            onChange={e => setDraft({ ...draft, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className={`${FIELD} tabular-nums`}
          />
          <input
            value={draft.department}
            onChange={e => setDraft({ ...draft, department: e.target.value })}
            placeholder="Department"
            className={FIELD}
          />
          <select
            value={draft.zoneId}
            onChange={e => setDraft({ ...draft, zoneId: e.target.value })}
            className={FIELD}
          >
            <option value="">Assign work zone…</option>
            {facility.blueprint.zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          <input
            value={draft.role}
            onChange={e => setDraft({ ...draft, role: e.target.value })}
            placeholder="Role"
            className={FIELD}
          />
          <select
            value={draft.shift}
            onChange={e => setDraft({ ...draft, shift: e.target.value as Employee['shift'] })}
            className={FIELD}
          >
            <option value="general">General shift</option>
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>
          <select
            value={draft.language}
            onChange={e => setDraft({ ...draft, language: e.target.value as Employee['language'] })}
            className={FIELD}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
        <button
          onClick={handleAddManual}
          disabled={busy}
          className="cta cta--primary cta--compact disabled:opacity-40"
        >
          Add to roster
        </button>
      </div>

      {/* Roster table */}
      <div className="panel">
        <div className="p-4 border-b border-line flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text--subtitle3 text-ink flex items-center gap-2">
            <Users className="w-4 h-4 text-ink" strokeWidth={1.5} />
            Roster
            <span className="text--footnote text-muted tabular-nums font-normal">
              {filtered.length} of {employees.length}
            </span>
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name, phone, zone…"
              className={`${FIELD} pl-9 w-64`}
            />
          </div>
        </div>

        {toast && (
          <div className="px-4 py-2.5 flex items-center gap-2 text--footnote bg-wash border-b border-line">
            <span className="sev-mark sev-mark--ok" />
            <span className="sev-text--ok">SENT</span>
            <span className="text-near">{toast}</span>
          </div>
        )}

        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-wash">
              <tr className="border-b border-line">
                <th className={TH}>Code</th>
                <th className={TH}>Name</th>
                <th className={TH}>WhatsApp</th>
                <th className={TH}>Reachability</th>
                <th className={TH}>Work zone</th>
                <th className={TH}>Shift</th>
                <th className={TH}>Lang</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} className="border-b border-line hover:bg-wash">
                  <td className="px-4 py-2.5 text--footnote text-subtle tabular-nums">{emp.employeeCode}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-6 h-6 shrink-0 rounded-full bg-paper flex items-center justify-center text-ink"
                        style={{ boxShadow: 'inset 0 0 0 1px #000000', fontSize: '10px', fontWeight: 500, lineHeight: 1 }}
                      >
                        {initials(emp.name)}
                      </span>
                      <span>
                        <span className="block text--footnote text-ink">{emp.name}</span>
                        <span className="block text--footnote text-muted">{emp.role} · {emp.department}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text--footnote text-near tabular-nums">{emp.phone}</td>
                  <td className="px-4 py-2.5 text--footnote">
                    {/* Reachable is a genuine "we can warn this person" state → green.
                        Opting out is a preference, not a hazard, so it takes the
                        neutral gray outline rather than an accent or a black
                        critical mark. */}
                    <span className="flex items-center gap-2">
                      <span className={`sev-mark ${emp.whatsappOptIn ? 'sev-mark--ok' : 'sev-mark--neutral'}`} />
                      <span className={`${HUE} ${emp.whatsappOptIn ? 'sev-text--ok' : 'text-muted'}`}>
                        {emp.whatsappOptIn ? 'REACHABLE' : 'OPTED OUT'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text--footnote text-subtle">{zoneName(emp.zoneId)}</td>
                  <td className="px-4 py-2.5 text--footnote text-subtle">{emp.shift}</td>
                  <td className="px-4 py-2.5 text--eyebrow text-muted">{emp.language}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleTest(emp.id)}
                      title={providerLive ? 'Send a live test WhatsApp' : 'Render a test message (simulation mode)'}
                      className="cta cta--secondary cta--mini inline-flex items-center gap-1 mr-1.5"
                    >
                      <Send className="w-3 h-3" strokeWidth={1.5} /> Test
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      aria-label={`Remove ${emp.name}`}
                      className="cta cta--secondary cta--mini inline-flex items-center"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text--body text-muted">
                    No employees on this roster yet. Upload a CSV or add one manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
