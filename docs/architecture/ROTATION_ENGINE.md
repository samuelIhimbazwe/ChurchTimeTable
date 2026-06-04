# Rotation Engine (MF-7)

`GET /operations/occurrences/:id/recommendations?assignmentType=MAIN_CHOIR`

Returns `AssignmentRecommendation` rows scored by:

- Days since last served (higher is better)
- Historical serve count (lower is better)
- Upcoming assignments (lower is better)

Leaders may override rules with `operations.override` when creating assignments.
