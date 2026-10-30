export default function Loading() {
  return (
    <main className="wrap" aria-busy="true" aria-label="Loading the venue" style={{ paddingTop: 110 }}>
      <div className="col g12" style={{ paddingBottom: 24 }}><div className="sk" style={{ width: 200, height: 22 }} /><div className="sk" style={{ width: 480, height: 64 }} /></div>
      <div className="gal"><div className="sk" style={{ gridRow: 'span 2', borderRadius: 0 }} /><div className="sk" style={{ borderRadius: 0 }} /><div className="sk" style={{ borderRadius: 0 }} /></div>
      <div className="vbody" style={{ paddingTop: 48 }}><div className="col g16"><div className="sk" style={{ height: 24 }} /><div className="sk" style={{ height: 24, width: '80%' }} /><div className="sk" style={{ height: 160 }} /></div><div className="sk" style={{ height: 520 }} /></div>
    </main>
  );
}
