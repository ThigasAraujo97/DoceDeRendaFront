# Copilot Instructions for DoceDeRenda

## Project Overview
DoceDeRenda is a React-based bakery order management system with Portuguese localization. It provides UI for managing customers, products, and orders with real-time search functionality.

**Architecture:** React SPA with typed components and API integration.

## Key Components & Structure

### UI Architecture
- **Monolithic component structure** in [program.js](../program.js): All UI components live in a single file with clear section separators (`// ===================== COMPONENT NAME =====================`)
- **Modular hooks pattern**: `useTable<T>()` is a reusable pagination/sorting hook - follow this pattern for similar features
- **Modal component**: Centralized base modal at the top; used for all dialogs

### Component Organization
1. **Type definitions** (lines 4-28): Core domain types (`Customer`, `Product`, `Order`, `OrderStatus`)
2. **Sidebar** (lines 50-65): Navigation between pages ("Dashboard", "Pedidos", "Clientes", "Produtos")
3. **OrdersPage** (lines 80-135): Grid display with pagination via `useTable` hook
4. **OrderEditor** (lines 137-290): Integrated form component with dual search (customers/products)
5. **App** (lines 292-end): Main component managing page state and routing

### API Integration
- **Single file**: [services/api.ts](../services/api.ts) contains generic `apiGet<T>()` and `apiPost<T>()` functions
- **Generic typing**: Both functions use TypeScript generics for type-safe API calls
- **Direct fetch calls**: OrderEditor uses raw fetch() for search endpoints (`/api/customers/search`, `/api/products/search`, `/api/orders`)
- **Error handling**: Minimal ("Erro na API") - expand with specific error messages when needed

## Critical Patterns & Conventions

### Styling
- **Tailwind CSS** for all styling (pink color scheme: `bg-pink-600`, `text-pink-700`, `bg-pink-100`)
- **Responsive**: Sidebar hidden on mobile (`hidden md:block`)
- **Interactive states**: `hover:bg-pink-50`, `hover:bg-pink-200` for hover effects

### State Management
- **React hooks only** (no external state management)
- **Controlled inputs**: All search inputs use `useState` with onChange handlers
- **Pagination state**: Delegated to `useTable` hook

### Search & Selection Pattern
Used in OrderEditor for both customers and products:
1. User types in input → triggers `searchFunction(term)`
2. Results displayed in absolute-positioned dropdown
3. Click on result → sets state and clears dropdown
4. This pattern is key for extensibility (e.g., Categories, Suppliers)

### Order Model
- `OrderStatus`: Enum with three values ("OrderPlaced", "Confirmed", "Finished")
- `Order`: Contains summary data only (customerName, total, status); `OrderEditor` contains line items
- Delivery date/time combined before API submission: ``${deliveryDate}T${deliveryTime}``

## Developer Workflows

### Adding a New Page
1. Add page name to Sidebar button list
2. Create new component in [program.js](../program.js) following section separator pattern
3. Add conditional render in App component (`{page === "PageName" && <Component />}`)
4. Import any needed API functions from [services/api.ts](../services/api.ts)

### Extending Search Features
- Duplicate search pattern from OrderEditor (customer/product search)
- Add new endpoint to `services/api.ts` if needed
- Use `useState` for search term and results; show dropdown on results.length > 0

### Adding Form Fields to OrderEditor
- Add `useState` hook at component start
- Add input element with onChange handler
- Include field in `saveOrder()` POST body

## Known Constraints & Notes

- No backend implementation details documented; API endpoints assumed to exist
- No error recovery or retry logic - consider adding for production
- Modal component uses `any` types - should be typed for better DX
- No validation beyond "cliente e itens" check in `saveOrder()`
- Portuguese UI labels throughout - maintain consistency

## Related Files to Review
- [program.js](../program.js) - All UI logic
- [services/api.ts](../services/api.ts) - API utilities
