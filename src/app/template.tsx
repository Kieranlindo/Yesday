/** Every page arrives with a soft fade and rise, so moving around feels like one app. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="pagein">{children}</div>;
}
