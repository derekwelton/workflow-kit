# Workload review

Read `../../orchestrate/references/workload-contract.md` and show the named
manifest. Review only frozen heads. The coordinator owns worker dispatch,
round reservations, tracker writes and final handoff. A dispatched reviewer
covers assigned axes without nested workers. Return full base/head, tested SHA,
execution identity and provider:full-head-sha:durable-receipt-id.
Fixes invalidate prior tests/receipt. Record reviewed-pending-integration and
keep the tracker in its code-review phase until the combined workload gate.
