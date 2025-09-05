import { cn } from '../../utils/cn';

// Main Table container with mobile card view
export const Table = ({ 
  children, 
  className, 
  responsive = true, 
  mobileCardView = false,
  cardRenderer,
  data = [],
  ...props 
}) => {
  const table = (
    <table
      className={cn(
        'w-full text-sm text-left text-gray-500 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div className="w-full">
        {/* Desktop Table View */}
        <div className={cn(
          "overflow-x-auto shadow-md rounded-lg",
          mobileCardView && "hidden md:block"
        )}>
          {table}
        </div>
        
        {/* Mobile Card View */}
        {mobileCardView && cardRenderer && (
          <div className="md:hidden space-y-3">
            {data.map((item, index) => cardRenderer(item, index))}
          </div>
        )}
      </div>
    );
  }

  return table;
};

// Table Header
export const TableHeader = ({ children, className, ...props }) => {
  return (
    <thead
      className={cn(
        'text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
};

// Table Body
export const TableBody = ({ children, className, ...props }) => {
  return (
    <tbody className={cn('divide-y divide-gray-200 dark:divide-gray-700', className)} {...props}>
      {children}
    </tbody>
  );
};

// Table Row
export const TableRow = ({ children, className, hoverable = true, ...props }) => {
  return (
    <tr
      className={cn(
        'bg-white dark:bg-gray-800',
        hoverable && 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

// Table Header Cell
export const TableHead = ({ children, className, sortable = false, onSort, sortDirection, ...props }) => {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-3 sm:px-6 sm:py-3 font-medium tracking-wider',
        sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="ml-1">
            {sortDirection === 'asc' ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            ) : sortDirection === 'desc' ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM2 15a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// Table Data Cell
export const TableCell = ({ children, className, ...props }) => {
  return (
    <td
      className={cn(
        'px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

// Table Footer
export const TableFooter = ({ children, className, ...props }) => {
  return (
    <tfoot
      className={cn(
        'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
};

// Table Pagination Component
export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700', className)}>
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md',
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {page}
              </button>
            );
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return <span key={page} className="px-2 py-1 text-gray-500">...</span>;
          }
          return null;
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Table;
