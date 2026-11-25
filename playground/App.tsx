import { Button, Icon } from "raia-ui";
import "./App.css";
import { createSignal } from "solid-js";
import { Divider } from "../src/components/primitives/divider";
import { Badge } from "../src/components/primitives/badge/Badge";

export function App() {
  const [loading, setLoading] = createSignal(false);
  return (
    <>
      <Button isLoading={loading()}>testing</Button>
      <Button variant="outline" onClick={() => setLoading((prev) => !prev)}>
        Toggle Loading
      </Button>

      <Divider>I'm here</Divider>

      <Badge variant="outline">I'm a badge</Badge>
      <Icon name="database" />
    </>
  );
}
