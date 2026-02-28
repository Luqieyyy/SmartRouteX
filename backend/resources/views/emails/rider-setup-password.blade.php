<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartRouteX Account Activation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #1a1a1a;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e5e5e5;
        }
        .header {
            background-color: #E10600;
            padding: 24px 32px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
        }
        .body {
            padding: 32px;
        }
        .body p {
            font-size: 14px;
            line-height: 1.7;
            color: #333333;
            margin: 0 0 16px;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #E10600;
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 40px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .btn:hover {
            background-color: #B00000;
        }
        .info-box {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            padding: 16px;
            margin: 20px 0;
            font-size: 13px;
            color: #666;
        }
        .footer {
            padding: 20px 32px;
            border-top: 1px solid #e5e5e5;
            font-size: 12px;
            color: #999999;
            text-align: center;
        }
        .footer a {
            color: #E10600;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SmartRouteX</h1>
        </div>

        <div class="body">
            <p>Hello <strong>{{ $rider->name }}</strong>,</p>

            <p>
                Your rider account has been created on SmartRouteX.
                To get started, please set up your password by clicking the button below.
            </p>

            <div class="btn-wrapper">
                <a href="{{ $setupUrl }}" class="btn">Set Up Your Password</a>
            </div>

            <div class="info-box">
                <strong>Important:</strong>
                <ul style="margin: 8px 0 0; padding-left: 20px;">
                    <li>This link will expire in <strong>24 hours</strong>.</li>
                    <li>This link can only be used <strong>once</strong>.</li>
                    <li>Your password must be at least 8 characters with at least 1 letter and 1 number.</li>
                </ul>
            </div>

            <p style="font-size: 13px; color: #666;">
                If you cannot click the button above, copy and paste this URL into your browser:
            </p>
            <p style="font-size: 12px; word-break: break-all; color: #999;">
                {{ $setupUrl }}
            </p>

            <p style="font-size: 13px; color: #666;">
                If you did not expect this email, please disregard it or contact your administrator.
            </p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} SmartRouteX. All rights reserved.
        </div>
    </div>
</body>
</html>
