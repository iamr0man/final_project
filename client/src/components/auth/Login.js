import React from 'react';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

const useStyles = makeStyles(theme => ({
    card: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        padding: '30px',
        border: '1px solid #ccc'
    },
    form: {
        width: '100%',
    },
    submit: {
        size: 'small',
        margin: theme.spacing(3, 0, 2),
        backgroundColor: '#000',
        color: '#fff',
    },
    link: {
        color: '#000',
        textDecoration: 'none'
    }
}));

export default function SignIn() {
    const classes = useStyles();

    return (
        <Container>
            <CssBaseline />
            <div className={classes.card}>
                <Typography component="h1" variant="h5">
                    Returning Customer
                </Typography>
                <h4>I am a returning customer</h4>
                <form className={classes.form}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <Grid container>
                        <Grid item xs>
                            <Link href="#" className={classes.link}>
                                Forgotten Password
                            </Link>
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        variant="contained"
                        className={classes.submit}>
                        Login
                    </Button>
                </form>
            </div>
        </Container>
    );
}