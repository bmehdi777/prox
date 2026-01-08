interface RequestDetailProps {
  header?: string;
  body?: string;
}

function RequestDetail({ header, body }: RequestDetailProps) {
  return (
    <div className="flex flex-col">
      <p className="text-lg font-medium pb-1">Headers</p>
      {header ? (
        <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
          {header}
        </code>
      ) : (
        <span className="text-center text-neutral-500">No header</span>
      )}
      <p className="text-lg font-medium pt-4 pb-1">Body</p>
      {body ? (
        <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
          {body}
        </code>
      ) : (
        <span className="text-center text-neutral-500">No body</span>
      )}
    </div>
  );
}

export default RequestDetail;
