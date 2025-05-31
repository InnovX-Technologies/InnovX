<?php
class PHP_Email_Form {
    public $ajax = false;
    public $to = '';
    public $from_name = '';
    public $from_email = '';
    public $subject = '';
    public $messages = array(); // Array to hold message parts
    public $smtp = false; // Placeholder for SMTP settings if needed

    public function add_message($value, $label, $priority = 5) {
        $this->messages[] = array(
            'value' => $value,
            'label' => $label,
            'priority' => $priority
        );
    }

    public function send() {
        // Build the email body from messages
        $body = "";
        foreach ($this->messages as $msg) {
            $body .= ucfirst($msg['label']) . ": " . $msg['value'] . "\n";
        }

        // Set email headers
        $headers = "From: " . $this->from_name . " <" . $this->from_email . ">\r\n";
        $headers .= "Reply-To: " . $this->from_email . "\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        // Send email using PHP's mail() function
        $success = mail($this->to, $this->subject, $body, $headers);

        // Return success or error message
        if ($success) {
            return json_encode(array('status' => 'success', 'message' => 'Your message has been sent.'));
        } else {
            return json_encode(array('status' => 'error', 'message' => 'Failed to send your message.'));
        }
    }
}
?>