interface PageWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}