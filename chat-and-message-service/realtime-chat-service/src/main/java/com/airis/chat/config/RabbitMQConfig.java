package com.airis.chat.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ配置类
 * 配置通知模块的消息队列
 *
 * @author AIRIS Team
 * @since 1.0.0
 */
@Configuration
@EnableRabbit
public class RabbitMQConfig {

    // 通知模块的交换机
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    
    // 通知模块的路由键
    public static final String NOTIFICATION_ROUTING_KEY = "notification.routingKey";
    
    // 通知队列名称
    public static final String NOTIFICATION_QUEUE = "notification.queue";

    /**
     * 创建通知交换机
     */
    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange(NOTIFICATION_EXCHANGE, true, false);
    }

    /**
     * 创建通知队列
     */
    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE, true);
    }

    /**
     * 绑定队列到交换机
     */
    @Bean
    public Binding notificationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(notificationExchange())
                .with(NOTIFICATION_ROUTING_KEY);
    }

    /**
     * JSON消息转换器
     */
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * RabbitTemplate配置
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
} 