# Custom Product Request Feature - Architecture Diagram

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│           Cat Breeds Shop Homepage (index.html)             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cat Breeds        [📝 Request Product] ← NEW BUTTON │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [🐈‍⬛ Maine Coon]  [🐱 Nordic Forest]  [😺 British]  [🐈 Bengal] │
│                                                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Product Request Modal (Hidden)  ← NEW       │    │
│  │  ╔═════════════════════════════════════════════╗    │    │
│  │  ║  Request a Product                    × ║    │    │    │
│  │  ╠═════════════════════════════════════════════╣    │    │
│  │  ║ Product Name *                              ║    │    │
│  │  ║ [____________________________]               ║    │    │
│  │  ║                                              ║    │    │
│  │  ║ Description                                  ║    │    │
│  │  ║ [____________________________]               ║    │    │
│  │  ║                                              ║    │    │
│  │  ║ Reference Link                               ║    │    │
│  │  ║ [____________________________]               ║    │    │
│  │  ║                                              ║    │    │
│  │  ║          [Add to Basket]                    ║    │    │
│  │  ╚═════════════════════════════════════════════╝    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
                     (Click Request button)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Modal Opens With Animation                      │
│                                                              │
│               ╔═════════════════════════╗                   │
│               ║ Request a Product  × ║                   │
│               ╠═════════════════════════╣                   │
│               ║ Product Name *          ║                   │
│               ║ [Siamese Cat____________]║                   │
│               ║                         ║                   │
│               ║ Description             ║                   │
│               ║ [Blue-eyed breed____]   ║                   │
│               ║                         ║                   │
│               ║ Reference Link          ║                   │
│               ║ [https://example.com__] ║                   │
│               ║                         ║                   │
│               ║    [Add to Basket]      ║                   │
│               ╚═════════════════════════╝                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   (Fill form & submit)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│             Shopping Basket (basket.html)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🐈‍⬛ Maine Coon                                               │
│  🐈 Bengal                                                   │
│  🔱 Wooden Skewers (5-pack)    [Auto-added, 1 per 3]        │
│                                                              │
│  📋 Siamese Cat [Customer Requested] [Edit] [Remove] ← NEW  │
│                    ↑ Yellow background & orange badge       │
│                                                              │
│            [Continue Shopping] [Checkout]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────┐
│  User Interaction            │
├──────────────────────────────┤
│                              │
│  1. Click "Request Product"  │
│     ↓                         │
│  2. Modal Opens              │
│     ↓                         │
│  3. Fill Form:               │
│     • Name (required)        │
│     • Description (optional) │
│     • Link (optional)        │
│     ↓                         │
│  4. Click "Add to Basket"    │
│     ↓                         │
│  5. Form Validation          │
│     (Name must be filled)    │
│     ↓                         │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  JavaScript Processing       │
├──────────────────────────────┤
│                              │
│  1. Generate Unique ID       │
│     requested_<time>_<cnt>   │
│     ↓                         │
│  2. Create Object:           │
│     {                        │
│       name: "...",           │
│       description: "...",    │
│       link: "..."            │
│     }                        │
│     ↓                         │
│  3. Store in localStorage    │
│     requested_products[id]   │
│     ↓                         │
│  4. Add ID to Basket         │
│     basket.push(id)          │
│     ↓                         │
│  5. Update localStorage      │
│                              │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  localStorage Structure      │
├──────────────────────────────┤
│                              │
│  "basket": [                 │
│    "maine_coon",             │
│    "bengal",                 │
│    "skewers",                │
│    "requested_123456_0"  ←── │
│  ]                           │
│                              │
│  "requested_products": {     │
│    "requested_123456_0": {   │
│      name: "Siamese",        │
│      description: "Blue-eyed"│
│      link: "https://..."     │
│    }                         │
│  }                           │
│                              │
└──────────────────────────────┘
              ↓
┌──────────────────────────────┐
│  Basket Rendering            │
├──────────────────────────────┤
│                              │
│  Loop through basket array:  │
│                              │
│  For each item:              │
│  ├─ If in PRODUCTS          │
│  │  └─ Render regular item  │
│  │     (emoji + name)       │
│  │                           │
│  └─ If starts "requested_"  │
│     └─ Get data from        │
│        requested_products   │
│        └─ Render with:      │
│           • 📋 emoji        │
│           • Product name    │
│           • Badge           │
│           • Edit button     │
│           • Remove button   │
│                              │
└──────────────────────────────┘
```

## State Machine Diagram

```
                           ┌─────────────┐
                           │   Initial   │
                           │   (Hidden)  │
                           └──────┬──────┘
                                  │
                    Click Request Button
                                  │
                                  ↓
                    ┌─────────────────────────┐
                    │  Modal.show = true      │
                    │  (Display: flex)        │
                    │  ↑                      │
         ┌──────────┼─ Form Empty             │
         │          │  Focus on Name Field    │
         │          └─────────────────────────┘
         │                      │
         │                      │ (User fills & submits)
         │                      ↓
         │          ┌─────────────────────────┐
         │          │  Processing Request     │
         │          │  ↓                      │
         │          │  Generate ID            │
         │          │  Store data             │
         │          │  Add to basket          │
         │          │  Update renders         │
         │          └─────────────────────────┘
         │                      │
         │                      ↓
         │          ┌─────────────────────────┐
         │          │  Modal.show = false     │
         │          │  (Display: none)        │
    ┌────┴──────────┼─ Close Modal            │
    │               │                         │
    │               └─────────────────────────┘
    │                       │
    ├───────────────────────┘  (Click Edit)
    │                          ↓
    │          ┌─────────────────────────────┐
    │          │  Modal.show = true          │
    │          │  Form Pre-filled with Data  │
    │          │                             │
    │          │  (User edits & submits)     │
    │          │  ↓                          │
    │          │  Update stored data         │
    │          │  Update renders             │
    │          │  Close modal                │
    │          └─────────────────────────────┘
    │
    ├───────────────────────── (Click Remove)
    │                          ↓
    │          ┌─────────────────────────────┐
    │          │  Show Confirmation Dialog   │
    │          │  "Remove item?"             │
    │          │                             │
    │          │  User clicks OK or Cancel   │
    │          │  ↓                          │
    │          │  Delete from requested_... │
    │          │  Remove from basket array   │
    │          │  Update renders             │
    │          └─────────────────────────────┘
    │
    ├───────────────────────── (Click ×, background, Escape)
    │                          ↓
    │          ┌─────────────────────────────┐
    │          │  Modal.show = false         │
    │          │  Form Reset                 │
    │          │  Close modal                │
    │          └─────────────────────────────┘
    │
    └───────────────────────────────────────→ Back to Initial
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  HTML Components                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────┐                 │
│  │  Request Product Button                │                 │
│  │  id="requestProductBtn"                │                 │
│  └────────────────────────────────────────┘                 │
│         │                                                    │
│         └──────────┬─────────────────────┐                  │
│                    │                     │                  │
│                    ↓                     ↓                  │
│         ┌──────────────────┐  ┌──────────────────┐          │
│         │  Modal Dialog    │  │  Form Elements   │          │
│         │  id="request     │  │                  │          │
│         │      Modal"      │  │ • productName    │          │
│         │                  │  │ • productDesc    │          │
│         │ • modal-header   │  │ • productLink    │          │
│         │ • modal-content  │  │ • submitBtn      │          │
│         │ • closeBtn       │  │                  │          │
│         │                  │  └──────────────────┘          │
│         └──────────────────┘                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              JavaScript Event Handlers                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  requestBtn.click        → Opens modal                      │
│  closeBtn.click          → Closes modal                     │
│  modal.click             → Close on background              │
│  document.keydown        → Close on Escape                  │
│  form.submit             → Create/Update request            │
│  editBtn.click           → Open edit modal                  │
│  removeBtn.click         → Delete with confirm              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Manipulation Functions                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • getRequestedProduct(id)       - Retrieve                │
│  • addRequestedProduct(...)      - Create                  │
│  • editRequestedProduct(id)      - Prepare edit            │
│  • removeRequestedProduct(id)    - Delete                  │
│  • renderBasket()                - Display                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              localStorage Persistence                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  localStorage["basket"]          - Item IDs               │
│  localStorage["requested_prod"]  - Product metadata       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              CSS Styling & Animations                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  .modal              - Base styles, hidden                │
│  .modal.show         - Display flex, visible               │
│  fadeIn animation    - Backdrop fade-in                    │
│  slideUp animation   - Modal content slide-up              │
│  .basket-requested   - Yellow background, orange border    │
│  .item-actions       - Edit/Remove buttons                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Dependencies Diagram

```
index.html
├── Imports shop.js
│   └── Uses PRODUCTS object
│       └── Uses getBasket()
│       └── Uses renderBasketIndicator()
│
├── Contains requestModal HTML
│   └── Form with 3 input fields
│   └── Referenced by shop.js
│
└── style.css
    └── Styles modal
    └── Styles form
    └── Styles basket-requested
    └── Styles animations

basket.html
├── Imports shop.js
│   └── Uses getBasket()
│   └── Uses renderBasket()
│   └── Uses getRequestedProduct()
│   └── Calls editRequestedProduct()
│   └── Calls removeRequestedProduct()
│
└── style.css
    └── Styles basket items
    └── Styles requested items

shop.js
├── PRODUCTS constant
├── Core functions:
│   ├── getBasket()
│   ├── addToBasket()
│   ├── clearBasket()
│   ├── syncSkewers()
│   └── renderBasket()
│
├── NEW Requested product functions:
│   ├── getRequestedProduct()
│   ├── addRequestedProduct()
│   ├── editRequestedProduct()
│   └── removeRequestedProduct()
│
└── Modal initialization:
    └── initRequestModal()
        └── All event handlers

style.css
├── Global styles
├── Modal styles
├── Form styles
├── Requested item styles
└── Animation keyframes
```

## Timeline Diagram

```
User Action          →  JavaScript Processing  →  Storage Update  →  DOM Update
─────────────────────────────────────────────────────────────────────────────

1. Click Request     → initRequestModal()      → (no change)      → Modal opens
   Button              .show class added                          fadeIn animation

2. Fill Form &       → Form validation        → localStorage[    → renderBasket()
   Submit              Generate unique ID        "requested_      shows new item
                       Create object            products"][id]   📋 Siamese Cat
                       addRequestedProduct()     = {name,desc,   [Customer Req]
                                                  link}            [Edit][Remove]

3. Click Edit        → editRequestedProduct() → (no change)      → Modal opens
   Button              Read from storage                          with pre-filled
                       dataset.editId = id                        form data

4. Edit Form &       → Form validation        → localStorage[    → renderBasket()
   Submit              Update object            "requested_      updates item
                       editRequestedProduct()    products"][id]
                                                = {new data}

5. Click Remove      → removeRequestedProduct()→ Delete from      → renderBasket()
   Button              Show confirm dialog      requested_        removes item
                       On OK:                   products[id]      from basket
                       Delete from storage      Remove from
                                                basket array

6. Click × / Esc     → closeModal()           → (no change)      → Modal closes
                       .show class removed                         with fadeOut
```

---

This architecture ensures clean separation of concerns, proper data flow, and maintainable code structure.
