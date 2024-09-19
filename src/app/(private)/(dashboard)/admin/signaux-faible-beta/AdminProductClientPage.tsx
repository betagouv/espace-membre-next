"use client";
import React, { useState } from "react";

import { format } from "date-fns";
import "react-tabulator/lib/styles.css"; // required styles
import "react-tabulator/lib/css/tabulator.min.css"; // theme
import { React15Tabulator, ColumnDefinition } from "react-tabulator";

interface CommunityProps {
    title: string;
    data: any[];
}

// Custom formatter using date-fns
const dateFormatter = (cell: any) => {
    const value = cell.getValue();
    if (value) {
        const date = new Date(value);
        // Format the date as YYYY-MM-DD using date-fns
        return format(date, "yyyy-MM-dd");
    }
    return "";
};

const allColumns: ColumnDefinition[] = [
    // { title: "UUID", field: "uuid" },
    { title: "Name", field: "name" },
    { title: "Audit", field: "audit" },
    {
        title: "Accessibility Status",
        field: "accessibility_status",
    },
    { title: "Current Phase", field: "current_phase" },
    {
        title: "Current Phase Start Date",
        field: "current_phase_start_date",
        formatter: dateFormatter,
    },
    { title: "Incubator", field: "incubator.name" }, // Assuming incubator has a name property
    {
        title: "Has Coach",
        field: "hasCoach",
        // formatter: "tickCross",
    }, // Boolean to tick/cross
    {
        title: "Has Intra",
        field: "hasIntra",
        // formatter: "tickCross",
    },
    {
        title: "Had Coach",
        field: "hadCoach",
        // formatter: "tickCross",
    },
    {
        title: "Had Intra",
        field: "hadIntra",
        // formatter: "tickCross",
    },
    {
        title: "Turnover Rate",
        field: "turnoverRateValue",
        // formatter: "progress",
        // formatterParams: { min: 0, max: 100 },
    }, // Assuming it's a percentage
    {
        title: "Average Mission Duration (Days)",
        field: "averageMissionDurationValue",
    },
    {
        title: "Renewal Rate",
        field: "renewalRateValue",
        formatter: "progress",
        formatterParams: { min: 0, max: 100 },
    },
    {
        title: "Average Replacement Frequency (Days)",
        field: "averageReplacementFrequencyValue",
    },
    {
        title: "Dev Missions Trend",
        field: "devMissionsTrend.current",
    }, // Example for trend, you can add more fields as needed
    {
        title: "Dev Missions Trend Over Three Months",
        field: "devMissionsTrend.trendOverThreeMonths",
    },
    {
        title: "Bizdev Missions Trend Over Three Months",
        field: "bizdevMissionsTrend.current",
    }, // Similarly for bizdev
    {
        title: "Bizdev Missions Trend",
        field: "bizdevMissionsTrend.trendOverThreeMonths",
    },
    {
        title: "Active Member Trend",
        field: "activeMember.current",
    }, // Assuming activeMember is a trend
    {
        title: "Active Member Trend Over 3 months",
        field: "activeMember.trendOverThreeMonths",
    },
];
const css = ".panel { min-height: 400px; }"; // to have enough space to display dropdown

var groupBy = function (xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};
/* Pure component */
export const AdminProductClientPage = (props: CommunityProps) => {
    // State to store the currently visible columns
    const [visibleColumns, setVisibleColumns] = useState(allColumns);

    // Toggle column visibility
    const handleColumnToggle = (columnField: string) => {
        setVisibleColumns((prevColumns) => {
            // If the column is already visible, remove it
            if (prevColumns.some((col) => col.field === columnField)) {
                return prevColumns.filter((col) => col.field !== columnField);
            }

            // Find the column in allColumns, but ensure it's defined
            const columnToAdd = allColumns.find(
                (col) => col.field === columnField
            );
            if (columnToAdd) {
                return [...prevColumns, columnToAdd];
            }
            console.log("LCS SET PREV COLUMNS");
            return prevColumns; // If no column is found, just return the previous state
        });
    };
    // const tableKey = visibleColumns.map((col) => col.field).join("-");
    return (
        <>
            <div className="module">
                {allColumns.map((column) => (
                    <label key={column.field}>
                        <input
                            type="checkbox"
                            checked={visibleColumns.some(
                                (col) => col.field === column.field
                            )}
                            onChange={() => handleColumnToggle(column.field!)}
                        />
                        {column.title}
                    </label>
                ))}
                <div
                    key={"filter-user"}
                    className="panel panel-full-width"
                    id="filter-user"
                >
                    <React15Tabulator
                        columns={visibleColumns}
                        data={props.data}
                        // options={{
                        //     pagination: "local",
                        //     paginationSize: 50,
                        // }}
                    />
                    <br />
                    <br />
                </div>
            </div>
            <style media="screen">{css}</style>
        </>
    );
};
