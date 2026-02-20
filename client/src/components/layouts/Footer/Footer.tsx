import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material"


export const Footer = () => {
    return (
        <Box
            component="footer"
            bgcolor="secondary.main"
            sx={{
                py: 3,
                textAlign: 'start',
                mb: { xs: 5, sm: 5, md: 0 }
            }}
        >
            <Container maxWidth="lg">
                <Typography variant="h3">KUON</Typography>
                <Typography>© 2026 Kuon</Typography>
            </Container>
        </Box>

    )
}