import { Button } from "raia-ui";
import "./App.css";
import { createSignal } from "solid-js";

export function App() {
  const [loading, setLoading] = createSignal(false);
  return (
    <>
      <Button isLoading={loading()}>testing</Button>
      <Button variant="outline" onClick={() => setLoading((prev) => !prev)}>
        Toggle Loading
      </Button>
    </>
  );
}
