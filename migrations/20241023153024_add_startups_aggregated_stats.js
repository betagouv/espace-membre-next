exports.up = function (knex) {
    return knex.schema.createTable(
        "startup_aggregated_stats",
        function (table) {
            // Defining the uuid column for startup, which will be a foreign key
            table.uuid("uuid").notNullable();
            table.string("current_phase");
            table.date("current_phase_start_date");
            // Additional columns as per your requirements
            table.boolean("has_coach");
            table.boolean("has_intra");
            table.boolean("had_coach");
            table.boolean("had_intra");
            table.decimal("turnover_rate_value"); // decimal with 2 decimal points
            table.decimal("average_mission_duration_value");
            table.decimal("renewal_rate_value");
            table.decimal("average_replacement_frequency_value");

            // devMissionsTrend columns
            table.decimal("dev_current");
            table.decimal("dev_one_month_ago");
            table.decimal("dev_two_months_ago");
            table.decimal("dev_three_months_ago");
            table.decimal("dev_change_from_last_month");
            table.decimal("dev_trend_over_three_months");
            table.decimal("dev_trend_over_six_months");
            table.decimal("dev_trend_over_twelve_months");

            // bizdevMissionsTrend columns
            table.decimal("bizdev_current");
            table.decimal("bizdev_one_month_ago");
            table.decimal("bizdev_two_months_ago");
            table.decimal("bizdev_three_months_ago");
            table.decimal("bizdev_change_from_last_month");
            table.decimal("bizdev_trend_over_three_months");
            table.decimal("bizdev_trend_over_six_months");
            table.decimal("bizdev_trend_over_twelve_months");

            // activeMember (missionsTrend) columns
            table.decimal("active_member_current");
            table.decimal("active_member_one_month_ago");
            table.decimal("active_member_two_months_ago");
            table.decimal("active_member_three_months_ago");
            table.decimal("active_member_change_from_last_month");
            table.decimal("active_member_trend_over_three_months");
            table.decimal("active_member_trend_over_six_months");
            table.decimal("active_member_trend_over_twelve_months");

            // Setting foreign key constraint on the 'uuid' column referencing startups.uuid
            table
                .foreign("uuid")
                .references("uuid")
                .inTable("startups")
                .onDelete("CASCADE");
        }
    );
};

exports.down = function (knex) {
    return knex.schema.dropTable("startup_aggregated_stats");
};
