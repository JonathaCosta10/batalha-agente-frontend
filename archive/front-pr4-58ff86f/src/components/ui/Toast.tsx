export function Toast({message}:{message:string}) {
  if(!message) return null;
  return <div className="toast" role="status" data-testid="status-toast">{message}</div>;
}
