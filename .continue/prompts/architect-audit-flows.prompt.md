Analyze the end-to-end business flows of this repository.

Focus on:
1. Register -> Login -> /me
2. Pricing -> Create Order
3. Order -> Payment Intent -> Payment Confirmation
4. Dispatch -> Pickup -> Delivery
5. Dispute -> Refund

For each flow, identify:
- entrypoints
- dependent entities
- state transitions
- validation rules
- role-based access assumptions
- missing links
- likely breakpoints

Return a verdict for each flow:
- VERIFIED
- PARTIALLY VERIFIED
- BROKEN
- NOT PROVABLE
