/**
 * Error handling utilities for the PMU Profit System
 * This module provides functions to catch, log, and handle various types of errors
 */
import React from 'react';

// Define error types for better categorization
export enum ErrorType {
  IMAGE = 'IMAGE',
  API = 'API',
  COMPONENT = 'COMPONENT',
  ROUTE = 'ROUTE',
  UNKNOWN = 'UNKNOWN'
}

// Error details interface
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  source?: string;
  stack?: string;
  timestamp: string;
  handled: boolean;
}

// Global error store to track errors across the application
class ErrorStore {
  private errors: ErrorDetails[] = [];
  private maxErrors = 50; // Limit the number of stored errors

  // Add a new error to the store
  addError(error: ErrorDetails): void {
    this.errors.unshift(error); // Add to the beginning
    
    // Trim the array if it exceeds the maximum size
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Log the error to the console
    this.logError(error);
  }

  // Get all errors
  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  // Get errors of a specific type
  getErrorsByType(type: ErrorType): ErrorDetails[] {
    return this.errors.filter(error => error.type === type);
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }

  // Log error to console with appropriate formatting
  private logError(error: ErrorDetails): void {
    const logStyles = {
      [ErrorType.IMAGE]: 'background: #f8d7da; color: #721c24; padding: 2px 5px; border-radius: 3px;',
      [ErrorType.API]: 'background: #d1ecf1; color: #0c5460; padding: 2px 5px; border-radius: 3px;',
      [ErrorType.COMPONENT]: 'background: #fff3cd; color: #856404; padding: 2px 5px; border-radius: 3px;',
      [ErrorType.ROUTE]: 'background: #d4edda; color: #155724; padding: 2px 5px; border-radius: 3px;',
      [ErrorType.UNKNOWN]: 'background: #e2e3e5; color: #383d41; padding: 2px 5px; border-radius: 3px;'
    };

    console.group(`%c${error.type} ERROR`, logStyles[error.type]);
    console.log(`Message: ${error.message}`);
    if (error.source) console.log(`Source: ${error.source}`);
    console.log(`Time: ${error.timestamp}`);
    if (error.stack) console.log(`Stack: ${error.stack}`);
    console.log(`Handled: ${error.handled ? 'Yes' : 'No'}`);
    console.groupEnd();
  }
}

// Create a singleton instance of the error store
export const errorStore = new ErrorStore();

/**
 * Capture and handle an error
 * @param error The error object
 * @param type The type of error
 * @param source The source of the error (component, file, etc.)
 * @returns The error details object
 */
export function captureError(
  error: Error | string,
  type: ErrorType = ErrorType.UNKNOWN,
  source?: string
): ErrorDetails {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;
  
  const errorDetails: ErrorDetails = {
    type,
    message: errorMessage,
    source,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    handled: true
  };
  
  // Add to the error store
  errorStore.addError(errorDetails);
  
  return errorDetails;
}

/**
 * Handle image loading errors
 * @param src The image source URL
 * @param error The error object
 * @returns The error details object
 */
export function handleImageError(src: string, error: Error): ErrorDetails {
  return captureError(
    `Failed to load image: ${src}. ${error.message}`,
    ErrorType.IMAGE,
    'Image Component'
  );
}

/**
 * Handle component errors
 * @param componentName The name of the component
 * @param error The error object
 * @returns The error details object
 */
export function handleComponentError(componentName: string, error: Error): ErrorDetails {
  return captureError(
    error,
    ErrorType.COMPONENT,
    componentName
  );
}

/**
 * Create an error boundary component wrapper
 * This is a higher-order component that catches errors in its children
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode,
  componentName: string
): React.FC<P> {
  return function ErrorBoundaryWrapper(props: P) {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      if (error instanceof Error) {
        handleComponentError(componentName, error);
      } else {
        handleComponentError(componentName, new Error(String(error)));
      }
      return React.createElement(React.Fragment, null, fallback);
    }
  };
}

/**
 * Check if a URL is valid
 * @param url The URL to check
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Safely parse JSON
 * @param json The JSON string to parse
 * @param fallback The fallback value if parsing fails
 * @returns The parsed JSON or the fallback value
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    captureError(
      `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
      ErrorType.UNKNOWN,
      'JSON Parser'
    );
    return fallback;
  }
}

/**
 * Safely execute a function and handle any errors
 * @param fn The function to execute
 * @param errorType The type of error
 * @param source The source of the error
 * @param fallback The fallback value if the function throws
 * @returns The result of the function or the fallback value
 */
export function safeExecute<T>(
  fn: () => T,
  errorType: ErrorType = ErrorType.UNKNOWN,
  source?: string,
  fallback?: T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    if (error instanceof Error) {
      captureError(error, errorType, source);
    } else {
      captureError(String(error), errorType, source);
    }
    return fallback;
  }
} 