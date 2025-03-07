import { useState } from "react";
import styles from "./HelloPage.module.scss"
import { useTheme } from "../../hooks/useTheme";
import axios from "axios";

export const HelloPage = () => {

  const [response, setResponse] = useState<any>("Update me");
  const { toggleTheme } = useTheme();

  return <div className={styles.container}>
    <h1>Deploy of React and C++ app!</h1>
    <div className={styles.controls}>
      <div className={styles.element}>
        <button onClick={toggleTheme}>
          Switch theme
        </button>
      </div>
      <div className={`${styles.element} ${styles.fetch}`}>
        <button onClick={() => {
          axios.post("http://localhost:8080/increment").then((res) => {
            setResponse(res.data.counter?.toString() || "ERROR");
            console.log(res);
          });
        }}>
          Update API counter
        </button>
        <div>
          {response}
        </div>
      </div>
    </div>
  </div>
}
