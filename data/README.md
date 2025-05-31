# Data Directory

This directory is used to store JSON files for the application's built-in database.

## Files

The application uses the following files:

- `products.json` - Stores all product data
- `production.json` - Stores all production entries
- `disposal.json` - Stores all disposal entries

## Information

These files are automatically created and managed by the application. You should not modify them directly unless you know what you're doing.

If you need to reset the database, you can either:
1. Delete these files and restart the application
2. Use the "Clear All Data" button in the application interface
3. Call the API endpoints: `/api/products/clear`, `/api/production/clear`, and `/api/disposal/clear`

## Setup

The directory is created automatically when the application starts. This README file ensures the directory is included in version control systems. 