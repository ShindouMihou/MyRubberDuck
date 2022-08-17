<script lang="ts">
    import { Icon } from '@steeze-ui/svelte-icon'
    import { Reply, Trash } from '@steeze-ui/heroicons'
    import { onMount } from "svelte";
    import Message from "$lib/components/message.svelte";
    import tippy from 'tippy.js';
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/themes/translucent.css'
    import { toHTML } from '$lib/renderer/markdown';
    import ErrorBlock from '$lib/components/ErrorBlock.svelte';
    import autosize from "autosize";
    import DOMPurify from 'isomorphic-dompurify';

    let messages: string[] = [];
    let contents = "";

    // CC: https://github.com/cure53/DOMPurify/issues/317#issuecomment-698800327
    DOMPurify.addHook('afterSanitizeAttributes', function (node) {
         // set all elements owning target to target=_blank
         if ('target' in node) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener');
        }
    });

    const WELCOME_MESSAGE = [
        "Hello,",
        "",
        "",
        "[My Rubber Duck 🦆](https://github.com/ShindouMihou/MyRubberDuck) is a platform where one can privately chat with themselves without any external servers receiving your messages.",
        "The platform was created to help software engineers stop making their friends into rubber ducks and make themselves into rubber ducks.",
        "", 
        "",
        "Clear your message by simply pressing the 🗑️ icon.",
        "Send your message by simply pressing the ↩️ button or ENTER key.",
        "",
        "[My Rubber Duck 🦆](https://github.com/ShindouMihou/MyRubberDuck) has markdown enabled on the message boxes.",
        "",
        "",
        "I hope you solve whatever production issue that you have.",
        "",
        "From,",
        "Your impostor!",
    ].join('\n')

    let keydownListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
        if (event.key !== "Enter") {
            return;
        }

        if ((event.key === "Enter" && event.shiftKey == true)) {
            return;
        }

        event.preventDefault()
        send();
    }

    let tippyInitialized = false
    let errors: string[] = []
    let loaded = false;

    onMount(() => {
        autosize(document.querySelector('#text-bar')!!)
        messages = JSON.parse(localStorage.getItem("messages") ?? "[]");

        if (messages.length === 0) {
            messages = [...messages, WELCOME_MESSAGE];
            localStorage.setItem("messages", JSON.stringify(messages))
        }

        setTimeout(() => document.querySelector('#scroll_point')!!.scrollIntoView(), 250)
        document.removeEventListener('keydown', keydownListener)
        document.addEventListener("keydown", keydownListener);

        if (tippyInitialized === false) {
            tippy('[data-tippy-content]', {
                theme: 'translucent'
            })
            tippyInitialized = true
        }

        document.querySelector('#text-bar')!!.setAttribute('placeholder', 'You are a rubber duck.')
        document.querySelector('#text-bar')!!.disabled = false;
        loaded = true;
    });


    function send() {
        if (!loaded) return
        if (contents.trim() === "") return

        messages = [...messages, contents];
        localStorage.setItem("messages", JSON.stringify(messages));

        contents = "";
        setTimeout(() => {
            autosize.update(document.querySelector('#text-bar')!!)
            document.querySelector('#scroll_point')!!.scrollIntoView()
        }, 200)
    }

    function html(content: string) {
        const translated = toHTML(content);

        if (translated.error && !translated.content) {
            errors = [translated.error];
            return translated.error;
        }

        return translated.content!;
    }

    function clear() {
        messages = [WELCOME_MESSAGE];
        localStorage.setItem("messages", JSON.stringify(messages));

        contents = "";
        autosize.update(document.querySelector('#text-bar')!!)
    }
</script>

<div class="flex flex-col w-full m-auto">
    {#if errors.length > 0}
        {#each errors as error}
            <ErrorBlock message={error} />
        {/each}
    {/if}
    <div class="flex flex-col gap-4 pt-[5.5rem] xl:pt-0 xl:pb-20" id="messages">
        {#each messages as message}
            <Message>
                {@html html(message)}
            </Message>
        {/each}
        <div id="scroll_point"></div>
    </div>
    <div class="top-0 xl:top-auto xl:bottom-0 py-7 bg-zinc-900 fixed left-0 px-4 xl:px-12 w-full" id="text-bar-container">
        <div class="flex flex-row justify-between bg-zinc-800 bg-opacity-80 max-h-96 w-full p-2 px-5 rounded-2xl border-2 h-fit border-zinc-700 items-center flex-shrink-0">
            <button on:click={clear} class="border-r pr-2 border-r-zinc-700" data-tippy-content="Clear Chat">
                <Icon src={Trash} class="h-6 w-6 flex-shrink-0"></Icon>
            </button>
            <textarea id="text-bar" rows="1" disabled placeholder="Loading..." class="ml-2 bg-transparent w-full max-h-96 p-2 outline-none resize-none" bind:value={contents}></textarea>
            <button on:click={send} data-tippy-content="Send Message">
                <Icon src={Reply} class="h-6 w-6 flex-shrink-0"></Icon>
            </button>
        </div>
    </div>
</div>
