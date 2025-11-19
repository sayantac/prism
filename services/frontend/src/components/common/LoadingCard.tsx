export const LoadingCard: React.FC = () => {
  return (
    <div className="card bg-base-100 shadow-xl animate-pulse">
      <figure className="px-4 pt-4">
        <div className="h-48 bg-base-300 rounded-xl w-full"></div>
      </figure>
      <div className="card-body">
        <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-base-300 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-base-300 rounded w-1/3"></div>
          <div className="h-8 bg-base-300 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};
