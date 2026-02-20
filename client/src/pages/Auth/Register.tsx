import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import {
    TextField,
    Button,
    Box,
    Typography,
    Container,
    Alert,
    CircularProgress
} from '@mui/material';
import { NavButton } from '../../components/common/NavButton';
import { useNavigate } from '@tanstack/react-router';

const Register: React.FC = () => {
    const [serverError, setServerError] = useState<string | null>(null);
    const navigate = useNavigate();
    const mutation = useMutation({
        mutationFn: async (data: any) => {
            // fetch を使用
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            // fetchは404や500でもokがfalseになるだけで例外を投げないため、手動でチェック
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'サーバーエラーが発生しました');
            }

            return response.json();
        },
        onSuccess: () => {
            alert('登録が完了しました！');
            navigate({ to: "/login" });
        },
        onError: (error: Error) => {
            // axiosの error.response.data ではなく、投げた Error の message を取得
            setServerError(error.message);
        },
    });

    // --- 以下のフォーム構造（useForm, JSX）は変更なし ---
    const form = useForm({
        defaultValues: {
            username: '',
            displayName: '',
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            mutation.mutate(value);
        },
    });

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    新規アカウント登録
                </Typography>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    style={{ width: '100%', marginTop: '24px' }}
                >
                    {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

                    <form.Field
                        name="username"
                        validators={{
                            onChange: ({ value }) => (!value ? 'ユーザー名は必須です' : undefined),
                        }}
                    >
                        {(field) => (
                            <TextField
                                fullWidth
                                label="ユーザー名"
                                margin="normal"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                error={field.state.meta.errors.length > 0}
                                helperText={field.state.meta.errors.join(', ')}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="displayName"
                        validators={{
                            onChange: ({ value }) => (!value ? '表示名は必須です' : undefined),
                        }}
                    >
                        {(field) => (
                            <TextField
                                fullWidth
                                label="表示名"
                                margin="normal"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                error={field.state.meta.errors.length > 0}
                                helperText={field.state.meta.errors.join(', ')}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="email"
                        validators={{
                            onChange: ({ value }) => {
                                if (!value) return 'メールアドレスは必須です';
                                if (!/^\S+@\S+$/.test(value)) return '無効な形式です';
                                return undefined;
                            },
                        }}
                    >
                        {(field) => (
                            <TextField
                                fullWidth
                                label="メールアドレス"
                                type="email"
                                margin="normal"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                error={field.state.meta.errors.length > 0}
                                helperText={field.state.meta.errors.join(', ')}
                            />
                        )}
                    </form.Field>

                    <form.Field
                        name="password"
                        validators={{
                            onChange: ({ value }) =>
                                value.length < 6 ? 'パスワードは6文字以上必要です' : undefined,
                        }}
                    >
                        {(field) => (
                            <TextField
                                fullWidth
                                label="パスワード"
                                type="password"
                                margin="normal"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                error={field.state.meta.errors.length > 0}
                                helperText={field.state.meta.errors.join(', ')}
                            />
                        )}
                    </form.Field>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                    >
                        {([canSubmit, isSubmitting]) => (
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={!canSubmit || mutation.isPending}
                            >
                                {mutation.isPending || isSubmitting ? <CircularProgress size={24} /> : '登録する'}
                            </Button>
                        )}
                    </form.Subscribe>
                </form>
                <NavButton path="/login" message="アカウントをお持ちですか？ログインはこちら" variant='outlined' />
            </Box>
        </Container>
    );
};

export default Register;