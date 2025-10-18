/**
 * @fileoverview Utilitários gerais para o projeto
 * @module utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS de forma inteligente usando clsx e tailwind-merge
 * 
 * Esta função é essencial para trabalhar com Tailwind CSS e componentes
 * dinâmicos. Ela:
 * 1. Usa clsx para processar classes condicionais e arrays
 * 2. Usa tailwind-merge para resolver conflitos de classes Tailwind
 * 
 * Isso evita problemas onde classes conflitantes (ex: 'p-4' e 'p-2')
 * são aplicadas simultaneamente, mantendo apenas a última.
 * 
 * @param {...ClassValue[]} inputs - Classes CSS (strings, arrays, objetos condicionais)
 * @returns {string} String de classes CSS otimizada e sem conflitos
 * 
 * @example
 * // Classes simples
 * cn('px-2 py-1', 'bg-blue-500') // "px-2 py-1 bg-blue-500"
 * 
 * @example
 * // Classes condicionais
 * cn('base-class', {
 *   'active-class': isActive,
 *   'disabled-class': isDisabled
 * })
 * 
 * @example
 * // Resolvendo conflitos Tailwind
 * cn('p-4 text-red-500', 'p-2') // "p-2 text-red-500" (p-4 é substituído)
 * 
 * @example
 * // Uso em componentes
 * function Button({ className, variant }) {
 *   return (
 *     <button className={cn(
 *       'px-4 py-2 rounded',
 *       variant === 'primary' && 'bg-blue-500',
 *       variant === 'secondary' && 'bg-gray-500',
 *       className
 *     )}>
 *       Click me
 *     </button>
 *   )
 * }
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
