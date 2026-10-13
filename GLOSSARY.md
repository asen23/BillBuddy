# BillBuddy

BillBuddy splits a restaurant receipt among the people who shared it: a photographed receipt becomes a list of items, the items are assigned to members, and every member gets their exact total.

## Language

### The bill

**Bill**:
The working set of items and members for one shared purchase, from extraction until the totals are settled.
_Avoid_: Order, invoice, check

**Receipt**:
The photograph of the purchase slip from which the items are extracted.
_Avoid_: Invoice, photo, scan

**Item**:
One line of the bill: a name, a unit price, and a count.
_Avoid_: Product, entry, line

**Count**:
The number of units of an item shown on the receipt.
_Avoid_: Quantity, qty

**Unit price**:
The price of one unit of an item.
_Avoid_: Price (bare), cost, amount

**Line total**:
The money owed for an item: its unit price multiplied by its count.
_Avoid_: Subtotal

**Rupiah**:
The unit of money this domain uses; whole numbers only — cents do not exist here.
_Avoid_: Cents, decimals

### The people

**Member**:
A person who shared the bill and owes a share of the items assigned to them.
_Avoid_: Person, user, participant, friend

### The split

**Assignment**:
The set of members an item is split among.
_Avoid_: Allocation, tag

**Unassigned**:
An item with no members in its assignment. Unassigned items stay visible in the result; they are never silently dropped.
_Avoid_: Orphan, skipped

**Share**:
A member's portion of an item's line total. Members sharing an item split it equally.
_Avoid_: Portion, part

**Remainder**:
The whole rupiah left over when a line total does not divide evenly among its members. Remainders are handed out one rupiah at a time in member list order, so member totals reconcile exactly with the receipt.
_Avoid_: Rest, rounding error

**Total**:
The sum of a member's shares across every item — what that member owes.
_Avoid_: Amount due, sum
