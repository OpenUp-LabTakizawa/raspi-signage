import dynamic from "next/dynamic";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { blue } from '@mui/material/colors';

const ContentsView = dynamic(() => import("../../components/dashboard/ManageContentsList"), { ssr: false });

export async function getServerSideProps() {
  return {
    props: {
      dashboard: true,
      areaDisplay: true
    }
  };
}

const theme = createTheme({
  palette: {
    primary: blue,
  },
});

function ManageContents() {


  return (
    <ThemeProvider theme={theme}>
      <ContentsView />
    </ThemeProvider>
  );
}

export default ManageContents;