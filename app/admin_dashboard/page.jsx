"use client";

// app/admin_dashboard/page.jsx

import { useEffect, useMemo, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatSubmittedAt(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return valueToDisplayText(value);

  return dateFormatter.format(date);
}

const TABLE_SHOWS_BY_REPORT = {
  depart: {
    title: "Department Performance",
    description: "Monitor submitted department KPI evaluations.",
    exportName: "department-performance.csv",
    departmentLabel: "Department",
    allDepartmentsLabel: "All Departments",
    columns: [
      { key: "evaluator", label: "Evaluator", minWidth: 160 },
      { key: "period", label: "Period", minWidth: 96 },
      { key: "divisions", label: "Divisions", minWidth: 150 },
      { key: "depart_kpi", label: "Depart KPI", minWidth: 220, wrap: true },
      {
        key: "score",
        label: "Score",
        align: "center",
        minWidth: 90,
        cellClassName: "metrics-table__score",
      },
      { key: "notes", label: "Notes", minWidth: 240, wrap: true },
      {
        key: "submitted_at",
        label: "Submitted At",
        align: "right",
        minWidth: 170,
        render: formatSubmittedAt,
      },
    ],
  },
  officer: {
    title: "Officer Performance",
    description: "Monitor submitted officer KPI evaluations.",
    exportName: "officer-performance.csv",
    departmentLabel: "Division",
    allDepartmentsLabel: "All Divisions",
    columns: [
      { key: "evaluator", label: "Evaluator", minWidth: 160 },
      { key: "evaluatee", label: "Evaluatee", minWidth: 160 },
      { key: "period", label: "Period", minWidth: 96 },
      { key: "divisions", label: "Divisions", minWidth: 150 },
      { key: "kpi", label: "KPI", minWidth: 220, wrap: true },
      {
        key: "score",
        label: "Score",
        align: "center",
        minWidth: 90,
        cellClassName: "metrics-table__score",
      },
      { key: "notes", label: "Notes", minWidth: 240, wrap: true },
      {
        key: "submitted_at",
        label: "Submitted At",
        align: "right",
        minWidth: 170,
        render: formatSubmittedAt,
      },
    ],
  },
};

function toReadableLabel(key) {
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getValueByPath(row, path) {
  return String(path)
    .split(".")
    .reduce((value, key) => value?.[key], row);
}

function valueToSearchText(value) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map(valueToSearchText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(valueToSearchText).join(" ");
  }

  return String(value);
}

function valueToDisplayText(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(valueToDisplayText).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function inferColumns(data) {
  const keys = [];
  const knownKeys = new Set();

  data.forEach((row) => {
    Object.keys(row ?? {}).forEach((key) => {
      if (!knownKeys.has(key)) {
        knownKeys.add(key);
        keys.push(key);
      }
    });
  });

  return keys.map((key) => ({
    key,
    label: toReadableLabel(key),
  }));
}

function escapeCsvValue(value) {
  const text = valueToDisplayText(value).replace(/"/g, '""');
  return `"${text}"`;
}

function downloadCsv(rows, columns, filename) {
  const header = columns
    .map((column) => escapeCsvValue(column.label))
    .join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => escapeCsvValue(getValueByPath(row, column.key)))
      .join(","),
  );

  const csv = [header, ...body].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true">
      <path d="M16.6 18 10.3 11.7a6.47 6.47 0 0 1-3.8 1.3 6.27 6.27 0 0 1-4.61-1.89A6.27 6.27 0 0 1 0 6.5a6.27 6.27 0 0 1 1.89-4.61A6.27 6.27 0 0 1 6.5 0a6.27 6.27 0 0 1 4.61 1.89A6.27 6.27 0 0 1 13 6.5a6.47 6.47 0 0 1-1.3 3.8l6.3 6.3-1.4 1.4ZM6.5 11c1.25 0 2.31-.44 3.19-1.31A4.34 4.34 0 0 0 11 6.5c0-1.25-.44-2.31-1.31-3.19A4.34 4.34 0 0 0 6.5 2c-1.25 0-2.31.44-3.19 1.31A4.34 4.34 0 0 0 2 6.5c0 1.25.44 2.31 1.31 3.19A4.34 4.34 0 0 0 6.5 11Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path d="M6.67 10 2.5 5.83l1.17-1.2 2.16 2.16V0H7.5v6.79l2.17-2.16 1.16 1.2L6.67 10ZM1.67 13.33c-.46 0-.85-.16-1.18-.49A1.61 1.61 0 0 1 0 11.67v-2.5h1.67v2.5h10v-2.5h1.66v2.5c0 .46-.16.85-.49 1.17-.32.33-.71.49-1.17.49h-10Z" />
    </svg>
  );
}

/**
 * Bentuk konfigurasi kolom yang bisa dikirim melalui prop `columns`:
 * {
 *   key: "submitted_at",          // Mendukung nested path, contoh: "department.name"
 *   label: "Submitted At",
 *   align: "left" | "center" | "right",
 *   searchable: true,              // Set false agar kolom tidak ikut global search
 *   hidden: false,
 *   wrap: false,
 *   minWidth: 160,
 *   cellClassName: "custom-class",
 *   render: (value, row) => value, // Gunakan untuk badge, format tanggal, action, dan lainnya
 * }
 */
export default function DepartmentPerformance({
  data,

  // Kirim prop `columns` untuk override urutan/label/format kolom.
  // Default kolom mengikuti TABLE_SHOWS_BY_REPORT sesuai request admin.
  columns,

  departmentKey = "divisions",
  periodKey = "period",

  initialPageSize = 4,
  pageSizeOptions = [4, 10, 25, 50],

  // TODO EXPORT INTEGRATION:
  // Isi `onExport` jika ekspor harus memanggil endpoint/service khusus.
  // Callback menerima data yang sudah terfilter dan konfigurasi kolom yang tampil.
  onExport,

  // TODO ROW ID:
  // Disarankan mengirim fungsi ini jika API menyediakan id unik.
  getRowId = (row, index) => row?.id ?? row?._id ?? index,
}) {
  const [reportType, setReportType] = useState("depart");
  const [reportRows, setReportRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const activeReport = TABLE_SHOWS_BY_REPORT[reportType];
  const hasExternalData = Array.isArray(data);
  const safeData = hasExternalData ? data : reportRows;
  const isReportLoading = hasExternalData ? false : isLoading;

  useEffect(() => {
    if (hasExternalData) {
      return;
    }

    const controller = new AbortController();

    async function loadReportRows() {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/admin/reports?type=${reportType}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Failed to load report data.");
        }

        setReportRows(Array.isArray(result?.data) ? result.data : []);
      } catch (error) {
        if (error.name === "AbortError") return;

        setReportRows([]);
        setLoadError(error.message || "Failed to load report data.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadReportRows();

    return () => controller.abort();
  }, [hasExternalData, reportType]);

  const resolvedColumns = useMemo(() => {
    const sourceColumns = Array.isArray(columns) && columns.length > 0
      ? columns
      : activeReport.columns.length > 0
        ? activeReport.columns
        : inferColumns(safeData);

    return sourceColumns
      .filter((column) => !column.hidden)
      .map((column) => ({
        align: "left",
        searchable: true,
        wrap: false,
        ...column,
        label: column.label ?? toReadableLabel(column.key),
      }));
  }, [activeReport.columns, columns, safeData]);

  const departmentOptions = useMemo(() => {
    return [
      ...new Set(safeData.map((row) => getValueByPath(row, departmentKey))),
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [safeData, departmentKey]);

  const periodOptions = useMemo(() => {
    return [...new Set(safeData.map((row) => getValueByPath(row, periodKey)))]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .sort((a, b) => String(b).localeCompare(String(a)));
  }, [safeData, periodKey]);

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return safeData.filter((row) => {
      const matchesDepartment =
        selectedDepartment === "all" ||
        String(getValueByPath(row, departmentKey)) === selectedDepartment;

      const matchesPeriod =
        selectedPeriod === "all" ||
        String(getValueByPath(row, periodKey)) === selectedPeriod;

      // GLOBAL SEARCH:
      // Query dibandingkan dengan seluruh kolom yang searchable, bukan hanya satu kolom.
      const matchesSearch =
        normalizedQuery === "" ||
        resolvedColumns.some((column) => {
          if (column.searchable === false) return false;

          const value = getValueByPath(row, column.key);
          return valueToSearchText(value)
            .toLocaleLowerCase()
            .includes(normalizedQuery);
        });

      return matchesDepartment && matchesPeriod && matchesSearch;
    });
  }, [
    safeData,
    searchQuery,
    selectedDepartment,
    selectedPeriod,
    departmentKey,
    periodKey,
    resolvedColumns,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const currentRows = useMemo(() => {
    const startIndex = (activePage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, activePage, pageSize]);

  const startEntry =
    filteredData.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const endEntry = Math.min(activePage * pageSize, filteredData.length);

  const handleReportTypeChange = (type) => {
    setReportType(type);
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedPeriod("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredData, resolvedColumns);
      return;
    }

    // FALLBACK EXPORT:
    // Tanpa library tambahan, file dibuat sebagai CSV yang dapat dibuka oleh Excel.
    downloadCsv(filteredData, resolvedColumns, activeReport.exportName);
  };

  return (
    // Header portal dan validasi admin dipindahkan ke app/admin_dashboard/layout.jsx.
    <main className="performance-page">
      <section className="performance-hero">
        <div className="performance-hero__copy">
          <h2>{activeReport.title}</h2>
          <p>{activeReport.description}</p>
          <div className="report-switcher" aria-label="Report type">
            {Object.entries(TABLE_SHOWS_BY_REPORT).map(([type, report]) => (
              <button
                key={type}
                type="button"
                className={
                  type === reportType
                    ? "report-switcher__button report-switcher__button--active"
                    : "report-switcher__button"
                }
                onClick={() => handleReportTypeChange(type)}
              >
                {report.title}
              </button>
            ))}
          </div>
        </div>

        <div className="performance-controls">
          <label className="field-group">
            <span>{activeReport.departmentLabel}</span>
            <select
              value={selectedDepartment}
              onChange={(event) => {
                setSelectedDepartment(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">{activeReport.allDepartmentsLabel}</option>
              {departmentOptions.map((department) => (
                <option key={String(department)} value={String(department)}>
                  {valueToDisplayText(department)}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Period</span>
            <select
              value={selectedPeriod}
              onChange={(event) => {
                setSelectedPeriod(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Periods</option>
              {periodOptions.map((period) => (
                <option key={String(period)} value={String(period)}>
                  {valueToDisplayText(period)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="export-button"
            onClick={handleExport}
            disabled={isReportLoading || filteredData.length === 0}
          >
            <DownloadIcon />
            <span>Ekspor ke Excel</span>
          </button>
        </div>
      </section>

      <section className="metrics-card">
        <div className="metrics-card__header">
          <h3>Detailed Metrics</h3>

          <label className="search-field">
            <span className="search-field__icon">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search all columns..."
              aria-label="Search all table columns"
            />
          </label>
        </div>

        <div className="metrics-table-wrapper">
          {loadError ? (
            <div className="metrics-alert" role="alert">
              {loadError}
            </div>
          ) : null}

          <table className="metrics-table">
            <thead>
              <tr>
                {resolvedColumns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`metrics-table__cell--${column.align}`}
                    style={{ minWidth: column.minWidth }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {isReportLoading ? (
                <tr>
                  <td
                    className="metrics-table__empty"
                    colSpan={Math.max(resolvedColumns.length, 1)}
                  >
                    Loading report data...
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((row, rowIndex) => {
                  const absoluteRowIndex =
                    (activePage - 1) * pageSize + rowIndex;

                  return (
                    <tr key={getRowId(row, absoluteRowIndex)}>
                      {resolvedColumns.map((column) => {
                        const value = getValueByPath(row, column.key);
                        const cellContent = column.render
                          ? column.render(value, row, absoluteRowIndex)
                          : valueToDisplayText(value);

                        const cellClasses = [
                          `metrics-table__cell--${column.align}`,
                          column.wrap ? "metrics-table__cell--wrap" : "",
                          column.cellClassName ?? "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <td
                            key={column.key}
                            className={cellClasses}
                            style={{ minWidth: column.minWidth }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="metrics-table__empty"
                    colSpan={Math.max(resolvedColumns.length, 1)}
                  >
                    No matching data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="metrics-card__footer">
          <p>
            Showing {startEntry} to {endEntry} of {filteredData.length} entries
          </p>

          <div className="pagination-controls">
            <label className="page-size-field">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="pagination-button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage === 1}
            >
              Previous
            </button>

            <span className="pagination-status">
              Page {activePage} of {totalPages}
            </span>

            <button
              type="button"
              className="pagination-button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, Math.min(page, activePage) + 1),
                )
              }
              disabled={activePage === totalPages || filteredData.length === 0}
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}

// OPTIONAL SERVICE USAGE EXAMPLE:
//
// function DepartmentPerformancePage() {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     async function loadMetrics() {
//       try {
//         // TODO: Ganti dengan fungsi dari services milik project.
//         const response = await performanceService.getDepartmentMetrics();
//         setRows(response.data ?? []);
//       } finally {
//         setLoading(false);
//       }
//     }
//
//     loadMetrics();
//   }, []);
//
//   if (loading) return <div>Loading...</div>;
//
//   return <DepartmentPerformance data={rows} />;
// }
