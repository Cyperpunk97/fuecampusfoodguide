/**
 * A dependency-free 3D food sculpture. CSS perspective keeps it reliable in
 * preview iframes, low-powered phones, and WebGL-disabled browsers.
 */
export function FoodOrbit() {
  return <div className="food-orbit" aria-hidden="true">
    <div className="food-orbit-stage">
      <span className="orbit-star" />
      <span className="orbit-bite orbit-bite-one" />
      <span className="orbit-bite orbit-bite-two" />
      <span className="orbit-bite orbit-bite-three" />
      <span className="orbit-plate" />
      <span className="orbit-saucer" />
      <span className="orbit-cup"><i /><b /></span>
      <span className="orbit-steam orbit-steam-one" />
      <span className="orbit-steam orbit-steam-two" />
    </div>
  </div>;
}
