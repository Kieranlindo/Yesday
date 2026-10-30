/** Shown for a moment while results load: soft shimmering cards in the shape of the real ones. */
export default function Loading() {
  return (
    <main className="wrap results" aria-busy="true" aria-label="Loading venues" style={{ paddingTop: 140 }}>
      <div className="col g12"><div className="sk" style={{ width: 260, height: 22 }} /><div className="sk" style={{ width: 520, height: 52 }} /></div>
      <div className="grid3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="col g12"><div className="sk" style={{ aspectRatio: '4 / 3' }} /><div className="sk" style={{ width: '70%', height: 28 }} /><div className="sk" style={{ width: '45%', height: 16 }} /></div>)}</div>
    </main>
  );
}
