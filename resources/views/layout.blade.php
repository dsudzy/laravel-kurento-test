<!DOCTYPE html>
<html>
<head>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>hello</title>
    <script src="{{ mix('/js/app.js') }}"></script>
    <link rel="stylesheet" type="text/css" href="{{ mix('/css/app.css') }}">
</head>
<body>

@yield('content')

</body>
</html>