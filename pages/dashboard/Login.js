import dynamic from "next/dynamic";
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ContentsView = dynamic(() => import("../../components/dashboard/LoginComponent"), { ssr: false });

export async function getServerSideProps() {
    return {
        props: {
            dashboard: true
        }
    }
}

const theme = createTheme();

function Login() {


  return (
    <ThemeProvider theme={theme}>
       <ContentsView />
    </ThemeProvider>
  );
}

export default Login;