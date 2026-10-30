/** Shown instead of the website on phones: couples use the app there. */
export default function GetTheApp() {
  return (
    <div className="getapp" role="main">
      <span className="w">Yes<i>day</i></span>
      <div className="col g16">
        <span className="s">say yes to the date.</span>
        <h1>Your wedding,<br />in <i>your pocket.</i></h1>
        <p>On your phone, Yesday is an app. Find your venue, book your custom tour, and keep your package, payments and messages in one place.</p>
        <span className="btn light lg full" aria-disabled="true">The Yesday app is coming soon</span>
        <p className="small" style={{ textAlign: 'center' }}>Planning on a computer? Open Yesday on your laptop and it’s all there.</p>
      </div>
    </div>
  );
}
