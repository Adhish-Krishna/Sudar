# CSS Variables Documentation

## Overview
This project uses CSS variables (custom properties) defined in `src/index.css` to maintain a consistent color scheme and design system throughout the application.

## Color Variables

### Primary Colors
- `--primary-color`: #3b82f6 (Main brand color)
- `--primary-hover`: #2563eb (Darker shade for hover states)
- `--secondary-color`: #6b7280 (Secondary/muted color)

### Background & Surface Colors
- `--background-color`: #f7fafc (Page background)
- `--surface-color`: #ffffff (Card/component backgrounds)

### Text Colors
- `--text-color`: #1f2937 (Primary text)
- `--text-muted`: #6b7280 (Secondary/muted text)

### UI Colors
- `--border-color`: #e5e7eb (Borders and dividers)
- `--success-color`: #10b981 (Success states)
- `--error-color`: #ef4444 (Error states)
- `--warning-color`: #f59e0b (Warning states)

### Shadow Variables
- `--shadow-sm`: Subtle shadow for small elements
- `--shadow-md`: Medium shadow for cards
- `--shadow-lg`: Large shadow for modals/prominent elements

## Usage Examples

### 1. Using CSS Classes (Recommended)
```tsx
// Use predefined utility classes
<button className="btn btn-primary">Primary Button</button>
<input className="input" placeholder="Enter text" />
<div className="card">Card content</div>
```

### 2. Using Inline Styles with CSS Variables
```tsx
// For custom styling or component-specific overrides
<button 
  style={{
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    padding: '0.75rem 1.5rem'
  }}
>
  Custom Button
</button>

<div 
  style={{
    backgroundColor: 'var(--surface-color)',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem'
  }}
>
  Custom Card
</div>
```

### 3. Using in Component Styles
```tsx
const MyComponent = () => {
  const cardStyle = {
    backgroundColor: 'var(--surface-color)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-sm)',
    padding: '1rem'
  };

  return <div style={cardStyle}>Content</div>;
};
```

## Available Utility Classes

### Buttons
- `.btn`: Base button styles
- `.btn-primary`: Primary button with brand colors
- `.btn-secondary`: Secondary button with neutral colors

### Inputs
- `.input`: Base input field styles with focus states

### Cards
- `.card`: Card container with background and shadow

### Text Colors
- `.text-primary`: Primary brand color text
- `.text-muted`: Muted/secondary text
- `.text-success`: Success state text
- `.text-error`: Error state text
- `.text-warning`: Warning state text

## Changing Colors Globally

To change the color scheme:

1. Open `src/index.css`
2. Modify the CSS variables in the `:root` selector
3. All components using these variables will automatically update

Example - Changing to a purple theme:
```css
:root {
  --primary-color: #8b5cf6;
  --primary-hover: #7c3aed;
  /* Other variables remain the same */
}
```

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Prefer utility classes** for common patterns
3. **Use inline styles** only for component-specific overrides
4. **Test color changes** in both light themes (can add dark theme support later)
5. **Maintain contrast ratios** for accessibility when changing colors

## Dark Theme Support (Future)

The CSS variable system is designed to support dark themes. When implementing:

1. Add a data attribute or class to the root element
2. Define alternative color values for dark mode
3. Components will automatically adapt

Example:
```css
/* Light theme (default) */
:root {
  --background-color: #f7fafc;
  --text-color: #1f2937;
}

/* Dark theme */
[data-theme="dark"] {
  --background-color: #1f2937;
  --text-color: #f7fafc;
}
```
