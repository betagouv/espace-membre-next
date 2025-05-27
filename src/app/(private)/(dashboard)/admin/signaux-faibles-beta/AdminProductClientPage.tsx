"use client";
import React, { useMemo, useState } from "react";

import { format } from "date-fns";
import {
  useTable,
  usePagination,
  useSortBy,
  useResizeColumns,
  useFlexLayout,
} from "react-table";

interface CommunityProps {
  title: string;
  data: any[];
}

// Custom date formatter using date-fns
const dateFormatter = (value: string) => {
  if (value) {
    const date = new Date(value);
    return format(date, "yyyy-MM-dd");
  }
  return "";
};

export const AdminProductClientPage = (props: CommunityProps) => {
  const allColumns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        canResize: true,
      },
      { Header: "Audit", accessor: "audit", canResize: true },
      {
        Header: "Accessibility Status",
        accessor: "accessibility_status",
        canResize: true,
        minWidth: 200,
      },
      {
        Header: "Current Phase",
        accessor: "current_phase",
        canResize: true,
      },
      {
        Header: "Current Phase Start Date",
        accessor: "current_phase_start_date",
        canResize: true,
        Cell: ({ value }: any) => dateFormatter(value),
      },
      {
        Header: "Incubator",
        accessor: "incubator.name",
        canResize: true,
      },
      {
        Header: "Has Coach",
        accessor: "hasCoach",
        canResize: true,
        Cell: ({ value }: any) => (value ? "✔️" : "❌"),
      },
      {
        Header: "Has Intra",
        accessor: "hasIntra",
        canResize: true,
        Cell: ({ value }: any) => (value ? "✔️" : "❌"),
      },
      {
        Header: "Had Coach",
        accessor: "hadCoach",
        canResize: true,
        Cell: ({ value }: any) => (value ? "✔️" : "❌"),
      },
      {
        Header: "Had Intra",
        accessor: "hadIntra",
        canResize: true,
        Cell: ({ value }: any) => (value ? "✔️" : "❌"),
      },
      // {
      //     Header: "Turnover Rate",
      //     accessor: "turnoverRateValue",
      //     canResize: true,
      // },
      // {
      //     Header: "Average Mission Duration (Days)",
      //     accessor: "averageMissionDurationValue",
      //     canResize: true,
      // },
      // {
      //     Header: "Renewal Rate",
      //     accessor: "renewalRateValue",
      //     canResize: true,
      // },
      // {
      //     Header: "Average Replacement Frequency (Days)",
      //     accessor: "averageReplacementFrequencyValue",
      //     canResize: true,
      // },
      {
        Header: "Taux de rotation",
        accessor: "turnoverRateValue",
        canResize: true,
        minWidth: 200,
        description:
          "Le pourcentage de personnes quittant l'organisation ou le projet sur une période donnée. Un taux de rotation élevé peut indiquer des difficultés à retenir les talents.",
      },
      {
        Header: "Durée moyenne des missions (jours)",
        accessor: "averageMissionDurationValue",
        canResize: true,
        minWidth: 200,
        description:
          "La durée moyenne, en jours, d'une mission ou d'un projet. Cela mesure le temps typique qu'une mission prend du début à la fin.",
      },
      {
        Header: "Taux de renouvellement",
        accessor: "renewalRateValue",
        canResize: true,
        minWidth: 200,
        description:
          "Le pourcentage de renouvellement des missions ou contrats. Cela représente combien de fois une mission est renouvelée ou prolongée.",
      },
      {
        Header: "Fréquence moyenne de remplacement (jours)",
        accessor: "averageReplacementFrequencyValue",
        canResize: true,
        minWidth: 250,
        description:
          "La fréquence moyenne, en jours, à laquelle les membres ou les participants d'un projet sont remplacés. Cela peut refléter la stabilité de l'équipe ou la nécessité de remplacer des membres.",
      },

      // {
      //     Header: "Dev Missions Trend",
      //     accessor: "devMissionsTrend.current",
      //     canResize: true,
      // },
      // {
      //     Header: "Dev Missions Trend Over Three Months",
      //     accessor: "devMissionsTrend.trendOverThreeMonths",
      //     canResize: true,
      // },
      // {
      //     Header: "Bizdev Missions Trend",
      //     accessor: "bizdevMissionsTrend.current",
      //     canResize: true,
      // },
      // {
      //     Header: "Bizdev Missions Trend Over Three Months",
      //     accessor: "bizdevMissionsTrend.trendOverThreeMonths",
      //     canResize: true,
      // },
      // {
      //     Header: "Nombre de missions active actuellement",
      //     accessor: "activeMember.current",
      //     canResize: true,
      // },
      {
        Header: "Tendances nombre de missions sur 12 derniers mois",
        accessor: "activeMember.trendOverTwelveMonths",
        canResize: true,
        description:
          "Nombre de membres actifs et tendance sur les 12 derniers mois.",
        Cell: ({ row }) => {
          const { activeMember } = row.original;
          const value = activeMember.trendOverTwelveMonths;
          // const color =
          //     value > 0 ? "black" : value < 0 ? "bac" : "inherit"; // Green for positive, yellow for negative

          return (
            <span>
              {value > 0 ? "+" : ""}
              {value}
            </span>
          );
        },
        sortType: (rowA, rowB) => {
          const a =
            parseFloat(rowA.original.activeMember.trendOverTwelveMonths) || 0;
          const b =
            parseFloat(rowB.original.activeMember.trendOverTwelveMonths) || 0;
          return a - b; // Ascending order sorting
        },
        minWidth: 300, // Sets a minimum width to fit content and title
        maxWidth: 500, // Prevents the column from getting too wide
      },
    ],
    [],
  );

  const [visibleColumns, setVisibleColumns] = useState(allColumns);

  // Toggle column visibility
  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns((prevColumns) =>
      prevColumns.some((col: any) => col.accessor === columnId)
        ? prevColumns.filter((col: any) => col.accessor !== columnId)
        : [
            ...prevColumns,
            allColumns.find((col) => col.accessor === columnId)!,
          ],
    );
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page, // The current page of rows
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    state: { pageIndex },
  } = useTable(
    {
      columns: visibleColumns,
      data: props.data,
      initialState: { pageIndex: 0, pageSize: 20 }, // Set the initial page size to 10
    },
    useSortBy, // Hook for sorting
    useResizeColumns,
    useFlexLayout,
    usePagination, // Add pagination hook
  );

  return (
    <>
      <div className="module">
        {/* Toggle buttons for each column */}
        {allColumns.map((column) => (
          <label
            key={column.accessor}
            style={{ paddingRight: 5, paddingLeft: 5 }}
          >
            <input
              type="checkbox"
              checked={visibleColumns.some(
                (col: any) => col.accessor === column.accessor,
              )}
              onChange={() => handleColumnToggle(column.accessor)}
            />
            {column.Header}
          </label>
        ))}

        {/* Custom Wrapper for the table */}
        <div className="fr-table--sm fr-table fr-table" id="table-sm-component">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table {...getTableProps()}>
                  <thead>
                    {headerGroups.map((headerGroup) => (
                      <tr
                        {...headerGroup.getHeaderGroupProps()}
                        key={headerGroup.id}
                      >
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps(
                              column.getSortByToggleProps(),
                            )}
                            title={column.description}
                            key={column.id}
                          >
                            {column.render("Header")}
                            {/* Add sort indicators */}
                            <span>
                              {column.isSorted
                                ? column.isSortedDesc
                                  ? " 🔽"
                                  : " 🔼"
                                : ""}
                            </span>
                            {/* Resizer handle */}
                            <div
                              {...column.getResizerProps()}
                              className={`resizer ${
                                column.isResizing ? "isResizing" : ""
                              }`}
                            />
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody {...getTableBodyProps()}>
                    {page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} key={row.id}>
                          {row.cells.map((cell) => (
                            <td
                              {...cell.getCellProps()}
                              style={{
                                ...cell.getCellProps().style, // Spread existing styles
                                ...(cell.column.id ===
                                "activeMember.trendOverTwelveMonths" // Conditional check for the column
                                  ? cell.value > 0
                                    ? {
                                        backgroundColor: "#27a658",
                                      } // Apply green background if value > 0
                                    : cell.value < 0
                                      ? {
                                          backgroundColor: "#ffca00",
                                        }
                                      : {} // Apply yellow background if value < 0
                                  : {}),
                              }}
                              id={cell.column.id}
                              key={cell.column.id}
                            >
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="pagination">
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            Previous
          </button>
          <span>
            Page {pageIndex + 1} of {pageOptions.length}
          </span>
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            Next
          </button>
        </div>
      </div>
      <style jsx>{`
        .table-wrapper {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          padding: 8px;
          text-align: left;
          border: 1px solid #ddd;
          position: relative;
        }
        .resizer {
          display: inline-block;
          width: 5px;
          height: 100%;
          position: absolute;
          right: 0;
          top: 0;
          cursor: col-resize;
          z-index: 1;
          background-color: transparent;
        }
        .isResizing {
          background-color: #f0f0f0;
        }
        .pagination {
          margin-top: 10px;
        }
        .pagination button {
          margin-right: 5px;
        }
      `}</style>
    </>
  );
};
