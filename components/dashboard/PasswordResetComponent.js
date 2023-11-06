import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { createRef, forwardRef, useEffect, useRef, useState } from "react";
import { getAuth, signOut } from '@firebase/auth';
import { useRouter } from "next/router";

import { useOrderContext } from './OrderContext';
import { checkAccountPassKey, getAccountDataClient } from '../../utilities/getContentDataClient';
import { updateAccountData } from '../../utilities/setContentData';

function PasswordResetComponent() {

    const [user, setUser] = useState({});
    const [email, setEmail] = useState("");
    const [nowPassword, setNowPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRePassword, setNewRePassword] = useState("");
    const [loginFlg, setLoginFlg] = useState(false);

    const [error, setError] = useState("");
    const [errorPart, setErrorPart] = useState("");
    const [showError, setShowError] = useState(false);

    const { uid, setUid, setUserName, progress, setProgress } = useOrderContext();

    const router = useRouter();

    const handleClose = (event, reason) => {
      if (reason === "clickaway") {
        return;
      }
      setStatus({ ...status, open: false });
    };

   useEffect(() => {
     async function getInfoData() {
       console.log(uid);
       if (!uid) return false;
       const user = await getAccountDataClient(uid);
       console.log(user);
       setUser(user);
       return user && user.passFlg;
     }
     const passFlg = getInfoData();
     if (!passFlg) {
       router.push("/dashboard/Login");
     }
   }, [progress])

    // Submitボタンを押したときの処理
  const onSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== newRePassword) return;
    try {
      setProgress(true); // スピナーを表示
      console.log(user);
      const check = await checkAccountPassKey(user.email);
      console.log(check);
      if (check != null) {
        const account = {
          passFlg: false
        }
        await updateAccountData(uid, account, user.email, nowPassword, newPassword);
        const auth = getAuth();
        await signOut(auth)
        setUid("");
        setUserName("");
        setProgress(false);
        router.push("/dashboard/Login");
      }
    } catch (e) {
      console.log(e);
    } finally {
      setProgress(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  }

    return (
        <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">パスワード再設定</Typography>
          <Box component="form" onSubmit={onSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              type="password"
              required
              fullWidth
              id="password"
              label="現在のパスワード"
              name="nowPassword"
              onInput={e => setNowPassword(e.target.value)}
              autoFocus
            />
            <TextField
              margin="normal"
              type="password"
              required
              fullWidth
              id="password"
              label="新しいパスワード"
              name="newPassword"
              onInput={e => setNewPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              type="password"
              required
              fullWidth
              id="password"
              label="新しいパスワード（再入力）"
              name="newRePassword"
              onInput={e => setNewRePassword(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>パスワード再設定</Button>
          </Box>
        </Box>
        <Dialog open={showError} onClose={handleCloseError}>
          <DialogContent>
            <Typography variant="h6" color="error">{error}</Typography>
            <Typography variant="body1">対象箇所</Typography>
            <Typography variant="body1">{errorPart}</Typography>
          </DialogContent>
        </Dialog>
        </Container>
    );
}

export default PasswordResetComponent;