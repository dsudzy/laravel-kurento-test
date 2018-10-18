@extends('layout')
@section('content')
<section>
    <h1>video</h1>
    <div>
            {{-- width: 640px;
            height: 480px; --}}
        <video id="video" autoplay width="640px" height="480px"></video>
    </div>
    <div>
        <button id="present">present</button>
        <button id="stop">stop</button>
        <button id="viewer">viewer</button>
    </div>
</section>
@endsection